import 'server-only';

import type { RetailCpuSeed } from '../types';

export const RETAIL_CPU_SEEDS: readonly RetailCpuSeed[] = [
  // Source: https://memoryzone.com.vn/cpu-intel-core-ultra-9-285k-up-to-5-7ghz-24-cores-24-threads-36mb
  {
    id: "cpu-intel-core-ultra-9-285k", name: "Intel Core Ultra 9 285K", vendor: "intel", priceVnd: 17950000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 24,
    threadsTotal: 24, pCores: 8, eCores: 16, baseClockGhz: 3.7,
    boostClockGhz: 5.7, cacheText: "L1 2432 KB, L2 40 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-6400",
    tdpW: 125, psuPowerW: 250, passmarkRaw: 67230, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-9-285k.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-ultra-9-285k-up-to-5-7ghz-24-cores-24-threads-36mb",
  },
  // Source: https://nguyencongpc.vn/cpu-intel-core-ultra-9-285
  {
    id: "cpu-intel-core-ultra-9-285", name: "Intel Core Ultra 9 285", vendor: "intel", priceVnd: 9999000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 24,
    threadsTotal: 24, pCores: 8, eCores: 16, baseClockGhz: 2.5,
    boostClockGhz: 5.6, cacheText: "L1 2432 KB, L2 40 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 182, passmarkRaw: 57844, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-9-285.webp", sourceUrl: "https://nguyencongpc.vn/cpu-intel-core-ultra-9-285",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+7+270K+Plus&id=7114
  {
    id: "cpu-intel-core-ultra-7-270k-plus", name: "Intel Core Ultra 7 270K Plus", vendor: "intel", priceVnd: 9590000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 24,
    threadsTotal: 24, pCores: 8, eCores: 16, baseClockGhz: 3.7,
    boostClockGhz: 5.5, cacheText: "L1 2432 KB, L2 40 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-7200",
    tdpW: 125, psuPowerW: 250, passmarkRaw: 68486, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-7-270k-plus.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+7+270K+Plus&id=7114",
  },
  // Source: https://phongvu.vn/c/cpu-intel-core-ultra-7
  {
    id: "cpu-intel-core-ultra-7-265k", name: "Intel Core Ultra 7 265K", vendor: "intel", priceVnd: 10490000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 20,
    threadsTotal: 20, pCores: 8, eCores: 12, baseClockGhz: 3.9,
    boostClockGhz: 5.5, cacheText: "L1 2048 KB, L2 36 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-6400",
    tdpW: 125, psuPowerW: 250, passmarkRaw: 58569, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-7-265k.webp", sourceUrl: "https://phongvu.vn/c/cpu-intel-core-ultra-7",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+7+265KF&id=6338
  {
    id: "cpu-intel-core-ultra-7-265kf", name: "Intel Core Ultra 7 265KF", vendor: "intel", priceVnd: 9990000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 20,
    threadsTotal: 20, pCores: 8, eCores: 12, baseClockGhz: 3.9,
    boostClockGhz: 5.5, cacheText: "L1 2048 KB, L2 36 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-6400",
    tdpW: 125, psuPowerW: 250, passmarkRaw: 58420, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-7-265kf.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+7+265KF&id=6338",
  },
  // Source: https://phongvu.vn/cpu-intel-core-ultra-7-265f--s250116206
  {
    id: "cpu-intel-core-ultra-7-265f", name: "Intel Core Ultra 7 265F", vendor: "intel", priceVnd: 10990000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 20,
    threadsTotal: 20, pCores: 8, eCores: 12, baseClockGhz: 2.4,
    boostClockGhz: 5.3, cacheText: "L1 2048 KB, L2 36 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 182, passmarkRaw: 49575, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-7-265f.webp", sourceUrl: "https://phongvu.vn/cpu-intel-core-ultra-7-265f--s250116206",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+5+250K+Plus&id=7221
  {
    id: "cpu-intel-core-ultra-5-250k-plus", name: "Intel Core Ultra 5 250K Plus", vendor: "intel", priceVnd: 6250000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 18,
    threadsTotal: 18, pCores: 6, eCores: 12, baseClockGhz: 4.2,
    boostClockGhz: 5.3, cacheText: "L1 1824 KB, L2 30 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-7200",
    tdpW: 125, psuPowerW: 159, passmarkRaw: 51426, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-250k-plus.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+5+250K+Plus&id=7221",
  },
  // Source: https://phongvu.vn/c/cpu-intel-core-ultra-5
  {
    id: "cpu-intel-core-ultra-5-245k", name: "Intel Core Ultra 5 245K", vendor: "intel", priceVnd: 6290000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 14,
    threadsTotal: 14, pCores: 6, eCores: 8, baseClockGhz: 4.2,
    boostClockGhz: 5.2, cacheText: "L1 1440 KB, L2 26 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-6400",
    tdpW: 125, psuPowerW: 159, passmarkRaw: 42968, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-245k.webp", sourceUrl: "https://phongvu.vn/c/cpu-intel-core-ultra-5",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+5+245KF&id=6336
  {
    id: "cpu-intel-core-ultra-5-245kf", name: "Intel Core Ultra 5 245KF", vendor: "intel", priceVnd: 6090000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 14,
    threadsTotal: 14, pCores: 6, eCores: 8, baseClockGhz: 4.2,
    boostClockGhz: 5.2, cacheText: "L1 1440 KB, L2 26 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-6400",
    tdpW: 125, psuPowerW: 159, passmarkRaw: 43042, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-245kf.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+Ultra+5+245KF&id=6336",
  },
  // Source: https://phongvu.vn/cpu-intel-core-ultra-5-225f--s250116202
  {
    id: "cpu-intel-core-ultra-5-225f", name: "Intel Core Ultra 5 225F", vendor: "intel", priceVnd: 4950000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 10,
    threadsTotal: 10, pCores: 6, eCores: 4, baseClockGhz: 3.3,
    boostClockGhz: 4.9, cacheText: "L1 1056 KB, L2 22 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 121, passmarkRaw: 30917, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-225f.webp", sourceUrl: "https://phongvu.vn/cpu-intel-core-ultra-5-225f--s250116202",
  },
  // Source: https://memoryzone.com.vn/cpu-intel-core-i9-14900k-up-to-6-0ghz-24-cores-32-threads-36mb
  {
    id: "cpu-intel-core-i9-14900k", name: "Intel Core i9-14900K", vendor: "intel", priceVnd: 13900000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 3.2,
    boostClockGhz: 6.0, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 58149, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-14900k.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-i9-14900k-up-to-6-0ghz-24-cores-32-threads-36mb",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-14900KF&id=5684
  {
    id: "cpu-intel-core-i9-14900kf", name: "Intel Core i9-14900KF", vendor: "intel", priceVnd: 15490000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 3.2,
    boostClockGhz: 6.0, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 58037, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-14900kf.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-14900KF&id=5684",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-14700K&id=5719
  {
    id: "cpu-intel-core-i7-14700k", name: "Intel Core i7-14700K", vendor: "intel", priceVnd: 10900000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 20,
    threadsTotal: 28, pCores: 8, eCores: 12, baseClockGhz: 3.4,
    boostClockGhz: 5.6, cacheText: "L1 1792 KB, L2 28 MB, L3 33 MB", l3CacheMb: 33.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 51887, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-14700k.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-14700K&id=5719",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-14700KF&id=5723
  {
    id: "cpu-intel-core-i7-14700kf", name: "Intel Core i7-14700KF", vendor: "intel", priceVnd: 10990000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 20,
    threadsTotal: 28, pCores: 8, eCores: 12, baseClockGhz: 3.4,
    boostClockGhz: 5.6, cacheText: "L1 1792 KB, L2 28 MB, L3 33 MB", l3CacheMb: 33.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 51901, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-14700kf.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-14700KF&id=5723",
  },
  // Source: https://memoryzone.com.vn/cpu-intel-core-i5-14600k-up-to-5-3ghz-14-cores-20-threads-24mb-box-cty
  {
    id: "cpu-intel-core-i5-14600k", name: "Intel Core i5-14600K", vendor: "intel", priceVnd: 7690000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 3.5,
    boostClockGhz: 5.3, cacheText: "L1 1280 KB, L2 24 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 181, passmarkRaw: 38341, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-14600k.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-i5-14600k-up-to-5-3ghz-14-cores-20-threads-24mb-box-cty",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-14600KF&id=5722
  {
    id: "cpu-intel-core-i5-14600kf", name: "Intel Core i5-14600KF", vendor: "intel", priceVnd: 7090000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 3.5,
    boostClockGhz: 5.3, cacheText: "L1 1280 KB, L2 24 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 181, passmarkRaw: 38211, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-14600kf.webp", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-14600KF&id=5722",
  },
  // Source: https://phongvu.vn/c/cpu-intel-core-i5
  {
    id: "cpu-intel-core-i5-14400f", name: "Intel Core i5-14400F", vendor: "intel", priceVnd: 4290000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 10,
    threadsTotal: 16, pCores: 6, eCores: 4, baseClockGhz: 2.5,
    boostClockGhz: 4.7, cacheText: "L1 960 KB, L2 9.5 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 148, passmarkRaw: 25387, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-14400f.webp", sourceUrl: "https://phongvu.vn/c/cpu-intel-core-i5",
  },
  // Source: https://nguyencongpc.vn/tag/intel-core-i3
  {
    id: "cpu-intel-core-i3-14100f", name: "Intel Core i3-14100F", vendor: "intel", priceVnd: 4190000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 4,
    threadsTotal: 8, pCores: null, eCores: null, baseClockGhz: 3.5,
    boostClockGhz: 4.7, cacheText: "L1 320 KB, L2 5 MB, L3 12 MB", l3CacheMb: 12.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 58, psuPowerW: 110, passmarkRaw: 15402, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i3-14100f.webp", sourceUrl: "https://nguyencongpc.vn/tag/intel-core-i3",
  },
  // Source: https://phongvu.vn/c/cpu-intel-core-i5
  {
    id: "cpu-intel-core-i5-13400f", name: "Intel Core i5-13400F", vendor: "intel", priceVnd: 5090000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 10,
    threadsTotal: 16, pCores: 6, eCores: 4, baseClockGhz: 2.5,
    boostClockGhz: 4.6, cacheText: "L1 960 KB, L2 9.5 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 148, passmarkRaw: 24871, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-13400f.webp", sourceUrl: "https://phongvu.vn/c/cpu-intel-core-i5",
  },
  // Source: https://phongvu.vn/c/cpu-intel-core-i5
  {
    id: "cpu-intel-core-i5-12400f", name: "Intel Core i5-12400F", vendor: "intel", priceVnd: 4290000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 2.5,
    boostClockGhz: 4.4, cacheText: "L1 576 KB, L2 7.5 MB, L3 18 MB", l3CacheMb: 18.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 117, passmarkRaw: 19520, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-12400f.webp", sourceUrl: "https://phongvu.vn/c/cpu-intel-core-i5",
  },
  // Source: https://phongvu.vn/cong-nghe/top-cpu-gaming-ngon-bo-re-nen-chon/
  {
    id: "cpu-intel-core-i3-12100f", name: "Intel Core i3-12100F", vendor: "intel", priceVnd: 2749000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 4,
    threadsTotal: 8, pCores: null, eCores: null, baseClockGhz: 3.3,
    boostClockGhz: 4.3, cacheText: "L1 384 KB, L2 5 MB, L3 12 MB", l3CacheMb: 12.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 58, psuPowerW: 89, passmarkRaw: 13949, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i3-12100f.webp", sourceUrl: "https://phongvu.vn/cong-nghe/top-cpu-gaming-ngon-bo-re-nen-chon/",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x3d.html
  {
    id: "cpu-amd-ryzen-9-9950x3d", name: "AMD Ryzen 9 9950X3D", vendor: "amd", priceVnd: 21090000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 16,
    threadsTotal: 32, pCores: null, eCores: null, baseClockGhz: 4.3,
    boostClockGhz: 5.7, cacheText: "L1 1280 KB, L2 16 MB, L3 128 MB", l3CacheMb: 128.0, ramSupport: "DDR5-5600",
    tdpW: 170, psuPowerW: 200, passmarkRaw: 70111, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-9950x3d.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x3d.html",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html
  {
    id: "cpu-amd-ryzen-9-9950x", name: "AMD Ryzen 9 9950X", vendor: "amd", priceVnd: 13950000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 16,
    threadsTotal: 32, pCores: null, eCores: null, baseClockGhz: 4.3,
    boostClockGhz: 5.7, cacheText: "L1 1280 KB, L2 16 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR5-5600",
    tdpW: 170, psuPowerW: 200, passmarkRaw: 65674, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-9950x.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9900x3d.html
  {
    id: "cpu-amd-ryzen-9-9900x3d", name: "AMD Ryzen 9 9900X3D", vendor: "amd", priceVnd: 18090000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 12,
    threadsTotal: 24, pCores: null, eCores: null, baseClockGhz: 4.4,
    boostClockGhz: 5.5, cacheText: "L1 960 KB, L2 12 MB, L3 128 MB", l3CacheMb: 128.0, ramSupport: "DDR5-5600",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 56042, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-9900x3d.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9900x3d.html",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9900x.html
  {
    id: "cpu-amd-ryzen-9-9900x", name: "AMD Ryzen 9 9900X", vendor: "amd", priceVnd: 11290000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 12,
    threadsTotal: 24, pCores: null, eCores: null, baseClockGhz: 4.4,
    boostClockGhz: 5.6, cacheText: "L1 960 KB, L2 12 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR5-5600",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 54277, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-9900x.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9900x.html",
  },
  // Source: https://memoryzone.com.vn/cpu-amd-ryzen-7-9850x3d-up-to-5-6ghz-8-cores-16-threads-96mb-100-100001973wof
  {
    id: "cpu-amd-ryzen-7-9850x3d", name: "AMD Ryzen 7 9850X3D", vendor: "amd", priceVnd: 14390000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 4.7,
    boostClockGhz: 5.6, cacheText: "L1 640 KB, L2 8 MB, L3 96 MB", l3CacheMb: 96.0, ramSupport: "DDR5-5600",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 41302, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-9850x3d.webp", sourceUrl: "https://memoryzone.com.vn/cpu-amd-ryzen-7-9850x3d-up-to-5-6ghz-8-cores-16-threads-96mb-100-100001973wof",
  },
  // Source: https://phongvu.vn/cong-nghe/danh-sach-cpu-choi-game-tot-nhat/
  {
    id: "cpu-amd-ryzen-7-9800x3d", name: "AMD Ryzen 7 9800X3D", vendor: "amd", priceVnd: 14390000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 4.7,
    boostClockGhz: 5.2, cacheText: "L1 640 KB, L2 8 MB, L3 96 MB", l3CacheMb: 96.0, ramSupport: "DDR5-5600",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 39911, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-9800x3d.webp", sourceUrl: "https://phongvu.vn/cong-nghe/danh-sach-cpu-choi-game-tot-nhat/",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9700x.html
  {
    id: "cpu-amd-ryzen-7-9700x", name: "AMD Ryzen 7 9700X", vendor: "amd", priceVnd: 10990000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 3.8,
    boostClockGhz: 5.5, cacheText: "L1 640 KB, L2 8 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5600",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 36912, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-9700x.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9700x.html",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-5-9600x.html
  {
    id: "cpu-amd-ryzen-5-9600x", name: "AMD Ryzen 5 9600X", vendor: "amd", priceVnd: 7900000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.9,
    boostClockGhz: 5.4, cacheText: "L1 480 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5600",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 30011, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-9600x.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-5-9600x.html",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html
  {
    id: "cpu-amd-ryzen-7-7800x3d", name: "AMD Ryzen 7 7800X3D", vendor: "amd", priceVnd: 12490000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 4.2,
    boostClockGhz: 5.0, cacheText: "L1 512 KB, L2 8 MB, L3 96 MB", l3CacheMb: 96.0, ramSupport: "DDR5-5200",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 34288, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-7800x3d.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800x3d.html",
  },
  // Source: https://nguyencongpc.vn/amd-ryzen-7-7700
  {
    id: "cpu-amd-ryzen-7-7700", name: "AMD Ryzen 7 7700", vendor: "amd", priceVnd: 5590000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 3.8,
    boostClockGhz: 5.3, cacheText: "L1 512 KB, L2 8 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 34312, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-7700.webp", sourceUrl: "https://nguyencongpc.vn/amd-ryzen-7-7700",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html
  {
    id: "cpu-amd-ryzen-5-7600", name: "AMD Ryzen 5 7600", vendor: "amd", priceVnd: 4750000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.8,
    boostClockGhz: 5.1, cacheText: "L1 384 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 26964, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-7600.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600.html",
  },
  // Source: https://nguyencongpc.vn/cpu-amd-ryzen-5-7500f-tray-new
  {
    id: "cpu-amd-ryzen-5-7500f", name: "AMD Ryzen 5 7500F", vendor: "amd", priceVnd: 3890000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.7,
    boostClockGhz: 5.0, cacheText: "L1 384 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 26487, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-7500f.webp", sourceUrl: "https://nguyencongpc.vn/cpu-amd-ryzen-5-7500f-tray-new",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-7-8700g
  {
    id: "cpu-amd-ryzen-7-8700g", name: "AMD Ryzen 7 8700G", vendor: "amd", priceVnd: 9490000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 4.2,
    boostClockGhz: 5.1, cacheText: "L1 512 KB, L2 8 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 31460, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-8700g.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-7-8700g",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8600g
  {
    id: "cpu-amd-ryzen-5-8600g", name: "AMD Ryzen 5 8600G", vendor: "amd", priceVnd: 6990000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 4.3,
    boostClockGhz: 5.0, cacheText: "L1 384 KB, L2 6 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 25164, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-8600g.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8600g",
  },
];
