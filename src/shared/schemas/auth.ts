import { z } from 'zod';
import {
  DISPLAY_NAME_MAX_LEN,
  DISPLAY_NAME_MIN_LEN,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  RESERVED_USERNAMES,
  USERNAME_MAX_LEN,
  USERNAME_MIN_LEN,
  USERNAME_REGEX,
} from '../constants';
import { normalizeWhitespaceNfc } from './checkout';

const reservedSet = new Set<string>(RESERVED_USERNAMES);

export const oauthProviderSchema = z.enum(['google', 'facebook']);

export const authLoginSchema = z.object({
  username: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1).max(USERNAME_MAX_LEN)),
  password: z.string().min(1).max(PASSWORD_MAX_LEN),
});

export const authRegisterSchema = z.object({
  username: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(
          USERNAME_MIN_LEN,
          `Tên đăng nhập phải có từ ${USERNAME_MIN_LEN} đến ${USERNAME_MAX_LEN} ký tự.`,
        )
        .max(
          USERNAME_MAX_LEN,
          `Tên đăng nhập phải có từ ${USERNAME_MIN_LEN} đến ${USERNAME_MAX_LEN} ký tự.`,
        )
        .regex(
          USERNAME_REGEX,
          'Tên đăng nhập chỉ gồm chữ thường, số và các ký tự _, ., -.',
        )
        .refine(
          (val) => !reservedSet.has(val),
          'Tên đăng nhập này không khả dụng.',
        ),
    ),
  displayName: z
    .string()
    .transform(normalizeWhitespaceNfc)
    .pipe(
      z
        .string()
        .min(
          DISPLAY_NAME_MIN_LEN,
          `Tên hiển thị phải từ ${DISPLAY_NAME_MIN_LEN} đến ${DISPLAY_NAME_MAX_LEN} ký tự.`,
        )
        .max(
          DISPLAY_NAME_MAX_LEN,
          `Tên hiển thị phải từ ${DISPLAY_NAME_MIN_LEN} đến ${DISPLAY_NAME_MAX_LEN} ký tự.`,
        )
        .refine(
          (val) => !/[\u0000-\u001F\u007F]/.test(val),
          'Tên hiển thị chứa ký tự không hợp lệ.',
        ),
    ),
  password: z
    .string()
    .min(
      PASSWORD_MIN_LEN,
      `Mật khẩu phải có từ ${PASSWORD_MIN_LEN} đến ${PASSWORD_MAX_LEN} ký tự.`,
    )
    .max(
      PASSWORD_MAX_LEN,
      `Mật khẩu phải có từ ${PASSWORD_MIN_LEN} đến ${PASSWORD_MAX_LEN} ký tự.`,
    ),
});

export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
