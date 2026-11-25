'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { useCartQuote } from '@/features/cart/useCartQuote';
import { usePlacedOrderPopup } from '@/features/orders/usePlacedOrderPopup';
import {
  ADDRESS_DATASET_DATE,
  FULL_NAME_MAX_LEN,
  FULL_NAME_MIN_LEN,
  NOTE_MAX_LEN,
  REVIEW_COUNTDOWN_SECONDS,
  STREET_MAX_LEN,
  STREET_MIN_LEN,
  VN_PHONE_REGEX,
} from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { normalizeVnPhone, normalizeWhitespaceNfc, paymentMethodSchema } from '@/shared/schemas';
import type {
  AddressOption,
  CheckoutRequest,
  PrepareResponse,
} from '@/shared/types';
import {
  clearCheckoutAttempt,
  saveCheckoutAttempt,
  type StoredCheckoutAttempt,
} from './attempt-storage';
import { handleUnavailableProductsError, usePlaceOrder } from './usePlaceOrder';

const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .refine(
      (v) => {
        const norm = normalizeWhitespaceNfc(v);
        return (
          norm.length >= FULL_NAME_MIN_LEN &&
          norm.length <= FULL_NAME_MAX_LEN &&
          !/[\u0000-\u001F\u007F]/.test(norm)
        );
      },
      VI_MESSAGES.checkout.validation.fullName,
    ),
  phone: z
    .string()
    .refine(
      (v) => VN_PHONE_REGEX.test(normalizeVnPhone(v)),
      VI_MESSAGES.checkout.validation.phone,
    ),
  provinceCode: z.string().trim().min(1, VI_MESSAGES.checkout.validation.province),
  wardCode: z.string().trim().min(1, VI_MESSAGES.checkout.validation.ward),
  streetAddress: z
    .string()
    .refine(
      (v) => {
        const norm = normalizeWhitespaceNfc(v);
        return norm.length >= STREET_MIN_LEN && norm.length <= STREET_MAX_LEN;
      },
      VI_MESSAGES.checkout.validation.street,
    ),
  note: z
    .string()
    .refine(
      (v) => normalizeWhitespaceNfc(v).length <= NOTE_MAX_LEN,
      VI_MESSAGES.checkout.validation.note,
    )
    .optional(),
  paymentMethod: paymentMethodSchema,
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export function useCheckoutController() {
  const router = useRouter();
  const { state: authState, actions: authActions } = useAuthSession();
  const placedOrderPopup = usePlacedOrderPopup();

  const [reviewAttempt, setReviewAttempt] = useState<StoredCheckoutAttempt | null>(null);
  const [countdown, setCountdown] = useState(REVIEW_COUNTDOWN_SECONDS);

  const { items, hasHydrated, quote } = useCartQuote('checkout', { requireItems: true });

  useEffect(() => {
    if (
      hasHydrated &&
      items.length === 0 &&
      !reviewAttempt &&
      !placedOrderPopup.state.hasCompletedOrder
    ) {
      router.replace('/cart?notice=empty-cart');
    }
  }, [hasHydrated, items.length, reviewAttempt, placedOrderPopup.state.hasCompletedOrder, router]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      phone: '',
      provinceCode: '',
      wardCode: '',
      streetAddress: '',
      note: '',
      paymentMethod: 'cod',
    },
  });

  useEffect(() => {
    if (authState.user && authState.user.role === 'customer' && !form.getValues('fullName')) {
      form.setValue('fullName', authState.user.displayName);
    }
  }, [authState.user, form]);

  const selectedProvinceCode = useWatch({ control: form.control, name: 'provinceCode' });
  const selectedWardCode = useWatch({ control: form.control, name: 'wardCode' });

  const provincesQuery = useQuery({
    queryKey: ['address', 'provinces', ADDRESS_DATASET_DATE],
    queryFn: () =>
      apiFetch<AddressOption[]>(`/api/address/provinces?v=${ADDRESS_DATASET_DATE}`),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const wardsQuery = useQuery({
    queryKey: ['address', 'wards', selectedProvinceCode, ADDRESS_DATASET_DATE],
    queryFn: () =>
      apiFetch<AddressOption[]>(
        `/api/address/provinces/${encodeURIComponent(selectedProvinceCode)}/wards?v=${ADDRESS_DATASET_DATE}`,
      ),
    enabled: Boolean(selectedProvinceCode),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const clearReviewAndRedirect = () => setReviewAttempt(null);

  const prepareMutation = useMutation({
    mutationFn: (request: CheckoutRequest) =>
      apiFetch<PrepareResponse>('/api/checkout/prepare', {
        method: 'POST',
        json: request,
      }),
  });

  const createOrderMutation = usePlaceOrder({
    onBeforeRedirect: clearReviewAndRedirect,
    onOrderPlaced: (res) => {
      setReviewAttempt(null);
      placedOrderPopup.actions.openPlacedOrder(res);
    },
  });

  async function onSubmitForm(values: CheckoutFormValues) {
    if (items.length === 0) {
      router.replace('/cart?notice=empty-cart');
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    const request: CheckoutRequest = {
      idempotencyKey,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customer: {
        fullName: values.fullName,
        phone: values.phone,
        provinceCode: values.provinceCode,
        wardCode: values.wardCode,
        streetAddress: values.streetAddress,
        note: values.note || undefined,
      },
      paymentMethod: values.paymentMethod,
    };

    try {
      const prepared = await prepareMutation.mutateAsync(request);
      const attempt: StoredCheckoutAttempt = { idempotencyKey, request, prepared };
      saveCheckoutAttempt(attempt);
      setCountdown(REVIEW_COUNTDOWN_SECONDS);
      setReviewAttempt(attempt);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'PRODUCT_UNAVAILABLE') {
        handleUnavailableProductsError(err, router, clearReviewAndRedirect);
        return;
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    }
  }

  function confirmReviewNow() {
    if (!reviewAttempt || createOrderMutation.isPending) {
      return;
    }
    if (reviewAttempt.request.paymentMethod === 'cod') {
      createOrderMutation.mutate(reviewAttempt.request);
      return;
    }
    setReviewAttempt(null);
    router.push('/checkout/payment');
  }

  useEffect(() => {
    if (!reviewAttempt || createOrderMutation.isPending) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        if (reviewAttempt.request.paymentMethod === 'cod') {
          createOrderMutation.mutate(reviewAttempt.request);
        } else {
          setReviewAttempt(null);
          router.push('/checkout/payment');
        }
        return;
      }
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [reviewAttempt, countdown, createOrderMutation, router]);

  return {
    state: {
      hasHydrated,
      isAuthLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      quote,
      provinces: provincesQuery.data ?? [],
      wards: wardsQuery.data ?? [],
      isLoadingWards: wardsQuery.isLoading,
      selectedProvinceCode,
      selectedWardCode,
      form,
      isPreparing: prepareMutation.isPending,
      reviewAttempt,
      countdown,
      isSubmittingOrder: createOrderMutation.isPending,
      placedOrderModal: placedOrderPopup.state,
    },
    actions: {
      onProvinceChange: (provinceCode: string) => {
        form.setValue('provinceCode', provinceCode, { shouldValidate: true });
        form.setValue('wardCode', '', { shouldValidate: false });
      },
      onWardChange: (wardCode: string) => {
        form.setValue('wardCode', wardCode, { shouldValidate: true });
      },
      onSubmitForm: form.handleSubmit(onSubmitForm),
      onCancelReview: () => {
        if (createOrderMutation.isPending) return;
        clearCheckoutAttempt();
        setReviewAttempt(null);
      },
      onConfirmReviewNow: confirmReviewNow,
      onRequestLogin: () =>
        authActions.openAuthModal({
          tab: 'login',
          notice: VI_MESSAGES.auth.checkoutLoginRequired,
          postLoginRedirect: '/checkout',
        }),
      placedOrderActions: placedOrderPopup.actions,
    },
  };
}
