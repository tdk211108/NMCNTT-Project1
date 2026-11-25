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
    boostClockGhz: 6, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 58149, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-14900k.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-i9-14900k-up-to-6-0ghz-24-cores-32-threads-36mb",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-14900KF&id=5684
  {
    id: "cpu-intel-core-i9-14900kf", name: "Intel Core i9-14900KF", vendor: "intel", priceVnd: 15490000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 3.2,
    boostClockGhz: 6, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
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
    boostClockGhz: 5, cacheText: "L1 512 KB, L2 8 MB, L3 96 MB", l3CacheMb: 96.0, ramSupport: "DDR5-5200",
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
    boostClockGhz: 5, cacheText: "L1 384 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
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
    boostClockGhz: 5, cacheText: "L1 384 KB, L2 6 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 25164, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-8600g.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8600g",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-250kf-plus-turbo-up-to-5-3ghz-18-nhan-18-luong-30mb-lga-1852
  {
    id: "cpu-intel-core-ultra-5-250kf-plus", name: "Intel Core Ultra 5 250KF Plus", vendor: "intel", priceVnd: 6790000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 18,
    threadsTotal: 18, pCores: 6, eCores: 12, baseClockGhz: 4.2,
    boostClockGhz: 5.3, cacheText: "L1 1824 KB, L2 30 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-7200",
    tdpW: 125, psuPowerW: 159, passmarkRaw: 50833, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-250kf-plus.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-250kf-plus-turbo-up-to-5-3ghz-18-nhan-18-luong-30mb-lga-1852",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-7-265
  {
    id: "cpu-intel-core-ultra-7-265", name: "Intel Core Ultra 7 265", vendor: "intel", priceVnd: 10990000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 20,
    threadsTotal: 20, pCores: 8, eCores: 12, baseClockGhz: 2.4,
    boostClockGhz: 5.3, cacheText: "L1 2048 KB, L2 36 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 182, passmarkRaw: 48280, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-7-265.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-7-265",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-245
  {
    id: "cpu-intel-core-ultra-5-245", name: "Intel Core Ultra 5 245", vendor: "intel", priceVnd: 8490000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 14,
    threadsTotal: 14, pCores: 6, eCores: 8, baseClockGhz: 3.5,
    boostClockGhz: 5.1, cacheText: "L1 1440 KB, L2 26 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 121, passmarkRaw: 39755, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-245.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-245",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-235
  {
    id: "cpu-intel-core-ultra-5-235", name: "Intel Core Ultra 5 235", vendor: "intel", priceVnd: 7990000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 14,
    threadsTotal: 14, pCores: 6, eCores: 8, baseClockGhz: 3.4,
    boostClockGhz: 5, cacheText: "L1 1440 KB, L2 26 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 121, passmarkRaw: 36483, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-235.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-235",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-225
  {
    id: "cpu-intel-core-ultra-5-225", name: "Intel Core Ultra 5 225", vendor: "intel", priceVnd: 5490000,
    architecture: "Arrow Lake-S", socket: "LGA1851", processNode: "TSMC N3B", coresTotal: 10,
    threadsTotal: 10, pCores: 6, eCores: 4, baseClockGhz: 3.3,
    boostClockGhz: 4.9, cacheText: "L1 1056 KB, L2 22 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-6400",
    tdpW: 65, psuPowerW: 121, passmarkRaw: 30376, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-ultra-5-225.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-ultra-5-225",
  },
  // Source: https://memoryzone.com.vn/cpu-intel-core-i9-14900ks-up-to-6-2ghz-24-cores-32-threads-36mb
  {
    id: "cpu-intel-core-i9-14900ks", name: "Intel Core i9-14900KS", vendor: "intel", priceVnd: 18990000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 3.2,
    boostClockGhz: 6.2, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 150, psuPowerW: 253, passmarkRaw: 59793, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-14900ks.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-i9-14900ks-up-to-6-2ghz-24-cores-32-threads-36mb",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-i9-14900
  {
    id: "cpu-intel-core-i9-14900", name: "Intel Core i9-14900", vendor: "intel", priceVnd: 15690000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 2,
    boostClockGhz: 5.8, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 65, psuPowerW: 219, passmarkRaw: 44376, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-14900.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-i9-14900",
  },
  // Source: https://memoryzone.com.vn/cpu-intel-core-i9-14900f
  {
    id: "cpu-intel-core-i9-14900f", name: "Intel Core i9-14900F", vendor: "intel", priceVnd: 14990000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 2,
    boostClockGhz: 5.8, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 65, psuPowerW: 219, passmarkRaw: 46438, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-14900f.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-i9-14900f",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-i7-14700-turbo-up-to-5-4ghz-20-nhan-28-luong-33mb-lga-1700-tray
  {
    id: "cpu-intel-core-i7-14700", name: "Intel Core i7-14700", vendor: "intel", priceVnd: 11290000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 20,
    threadsTotal: 28, pCores: 8, eCores: 12, baseClockGhz: 2.1,
    boostClockGhz: 5.4, cacheText: "L1 1792 KB, L2 28 MB, L3 33 MB", l3CacheMb: 33.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 65, psuPowerW: 219, passmarkRaw: 40153, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-14700.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-i7-14700-turbo-up-to-5-4ghz-20-nhan-28-luong-33mb-lga-1700-tray",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-i7-14700f
  {
    id: "cpu-intel-core-i7-14700f", name: "Intel Core i7-14700F", vendor: "intel", priceVnd: 10990000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 20,
    threadsTotal: 28, pCores: 8, eCores: 12, baseClockGhz: 2.1,
    boostClockGhz: 5.4, cacheText: "L1 1792 KB, L2 28 MB, L3 33 MB", l3CacheMb: 33.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 65, psuPowerW: 219, passmarkRaw: 41229, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-14700f.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-i7-14700f",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-i5-14600-turbo-up-to-5-2ghz-14-nhan-20-luong-24mb-lga-1700-tray
  {
    id: "cpu-intel-core-i5-14600", name: "Intel Core i5-14600", vendor: "intel", priceVnd: 7990000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 2.7,
    boostClockGhz: 5.2, cacheText: "L1 1248 KB, L2 20 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 65, psuPowerW: 154, passmarkRaw: 35746, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-14600.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-i5-14600-turbo-up-to-5-2ghz-14-nhan-20-luong-24mb-lga-1700-tray",
  },
  // Source: https://phongvu.vn/cpu-intel-core-i5-14500-3-5-ghz-5-3-ghz-turbo-boost--s231204442
  {
    id: "cpu-intel-core-i5-14500", name: "Intel Core i5-14500", vendor: "intel", priceVnd: 7050000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 2.6,
    boostClockGhz: 5, cacheText: "L1 1248 KB, L2 11.5 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 154, passmarkRaw: 30437, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-14500.webp", sourceUrl: "https://phongvu.vn/cpu-intel-core-i5-14500-3-5-ghz-5-3-ghz-turbo-boost--s231204442",
  },
  // Source: https://memoryzone.com.vn/cpu-intel-core-i5-14400-up-to-4-7ghz-10-cores-16-threads-20mb
  {
    id: "cpu-intel-core-i5-14400", name: "Intel Core i5-14400", vendor: "intel", priceVnd: 6650000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 10,
    threadsTotal: 16, pCores: 6, eCores: 4, baseClockGhz: 2.5,
    boostClockGhz: 4.7, cacheText: "L1 864 KB, L2 9.5 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 148, passmarkRaw: 24933, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-14400.webp", sourceUrl: "https://memoryzone.com.vn/cpu-intel-core-i5-14400-up-to-4-7ghz-10-cores-16-threads-20mb",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-intel-core-i3-14100-turbo-up-to-4-7ghz-4-nhan-8-luong-12mb-lga-1700-tray
  {
    id: "cpu-intel-core-i3-14100", name: "Intel Core i3-14100", vendor: "intel", priceVnd: 4490000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 4,
    threadsTotal: 8, pCores: null, eCores: null, baseClockGhz: 3.5,
    boostClockGhz: 4.7, cacheText: "L1 320 KB, L2 5 MB, L3 12 MB", l3CacheMb: 12.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 60, psuPowerW: 110, passmarkRaw: 15097, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i3-14100.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-intel-core-i3-14100-turbo-up-to-4-7ghz-4-nhan-8-luong-12mb-lga-1700-tray",
  },
  // Source: https://phongvu.vn/cpu-amd-ryzen-9-9950x3d2--s260304019
  {
    id: "cpu-amd-ryzen-9-9950x3d2", name: "AMD Ryzen 9 9950X3D2", vendor: "amd", priceVnd: 28990000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 16,
    threadsTotal: 32, pCores: null, eCores: null, baseClockGhz: 4.3,
    boostClockGhz: 5.6, cacheText: "L1 1280 KB, L2 16 MB, L3 192 MB", l3CacheMb: 192.0, ramSupport: "DDR5-5600",
    tdpW: 200, psuPowerW: 270, passmarkRaw: 72116, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-9950x3d2.webp", sourceUrl: "https://phongvu.vn/cpu-amd-ryzen-9-9950x3d2--s260304019",
  },
  // Source: https://hugotech.vn/cpu-amd-ryzen-5-9600-tray-100-000000718/
  {
    id: "cpu-amd-ryzen-5-9600", name: "AMD Ryzen 5 9600", vendor: "amd", priceVnd: 6890000,
    architecture: "Zen 5", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.8,
    boostClockGhz: 5.2, cacheText: "L1 480 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5600",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 29263, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-9600.webp", sourceUrl: "https://hugotech.vn/cpu-amd-ryzen-5-9600-tray-100-000000718/",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-5-7500x3d-am5-6-nhan-12-luong-max-4-5-ghz-no-box-100-000001904
  {
    id: "cpu-amd-ryzen-5-7500x3d", name: "AMD Ryzen 5 7500X3D", vendor: "amd", priceVnd: 5990000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 4,
    boostClockGhz: 4.5, cacheText: "L1 384 KB, L2 6 MB, L3 96 MB", l3CacheMb: 96.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 25021, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-7500x3d.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-5-7500x3d-am5-6-nhan-12-luong-max-4-5-ghz-no-box-100-000001904",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-5-7600x3d-box-cong-ty
  {
    id: "cpu-amd-ryzen-5-7600x3d", name: "AMD Ryzen 5 7600X3D", vendor: "amd", priceVnd: 7990000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 4.1,
    boostClockGhz: 4.7, cacheText: "L1 384 KB, L2 6 MB, L3 96 MB", l3CacheMb: 96.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 25845, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-7600x3d.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-5-7600x3d-box-cong-ty",
  },
  // Source: https://phongvu.vn/cpu-amd-ryzen-9-7950x3d-4-2ghz-boost-to-5-7ghz--s230603083
  {
    id: "cpu-amd-ryzen-9-7950x3d", name: "AMD Ryzen 9 7950X3D", vendor: "amd", priceVnd: 19289000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 16,
    threadsTotal: 32, pCores: null, eCores: null, baseClockGhz: 4.2,
    boostClockGhz: 5.7, cacheText: "L1 1024 KB, L2 16 MB, L3 128 MB", l3CacheMb: 128.0, ramSupport: "DDR5-5200",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 62304, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-7950x3d.webp", sourceUrl: "https://phongvu.vn/cpu-amd-ryzen-9-7950x3d-4-2ghz-boost-to-5-7ghz--s230603083",
  },
  // Source: https://phongvu.vn/cpu-amd-ryzen-9-7950x-4-5ghz-boost-to-5-7ghz--s220919567
  {
    id: "cpu-amd-ryzen-9-7950x", name: "AMD Ryzen 9 7950X", vendor: "amd", priceVnd: 20990000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 16,
    threadsTotal: 32, pCores: null, eCores: null, baseClockGhz: 4.5,
    boostClockGhz: 5.7, cacheText: "L1 1024 KB, L2 16 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR5-5200",
    tdpW: 170, psuPowerW: 230, passmarkRaw: 62115, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-7950x.webp", sourceUrl: "https://phongvu.vn/cpu-amd-ryzen-9-7950x-4-5ghz-boost-to-5-7ghz--s220919567",
  },
  // Source: https://phongvu.vn/cpu-amd-ryzen-9-7900x3d-4-4ghz-boost-to-5-6ghz--s230603084
  {
    id: "cpu-amd-ryzen-9-7900x3d", name: "AMD Ryzen 9 7900X3D", vendor: "amd", priceVnd: 14859000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 12,
    threadsTotal: 24, pCores: null, eCores: null, baseClockGhz: 4.4,
    boostClockGhz: 5.6, cacheText: "L1 768 KB, L2 12 MB, L3 128 MB", l3CacheMb: 128.0, ramSupport: "DDR5-5200",
    tdpW: 120, psuPowerW: 162, passmarkRaw: 50197, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-7900x3d.webp", sourceUrl: "https://phongvu.vn/cpu-amd-ryzen-9-7900x3d-4-4ghz-boost-to-5-6ghz--s230603084",
  },
  // Source: https://phongvu.vn/cpu-amd-ryzen-9-7900x-4-7ghz-boost-to-5-6ghz--s220919568
  {
    id: "cpu-amd-ryzen-9-7900x", name: "AMD Ryzen 9 7900X", vendor: "amd", priceVnd: 11290000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 12,
    threadsTotal: 24, pCores: null, eCores: null, baseClockGhz: 4.7,
    boostClockGhz: 5.6, cacheText: "L1 768 KB, L2 12 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR5-5200",
    tdpW: 170, psuPowerW: 230, passmarkRaw: 51204, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-7900x.webp", sourceUrl: "https://phongvu.vn/cpu-amd-ryzen-9-7900x-4-7ghz-boost-to-5-6ghz--s220919568",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-9-7900-chinh-hang-3-7ghz-up-to-5-4ghz-12-cores-24-threads-am5
  {
    id: "cpu-amd-ryzen-9-7900", name: "AMD Ryzen 9 7900", vendor: "amd", priceVnd: 11990000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 12,
    threadsTotal: 24, pCores: null, eCores: null, baseClockGhz: 3.7,
    boostClockGhz: 5.4, cacheText: "L1 768 KB, L2 12 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 48008, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-7900.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-9-7900-chinh-hang-3-7ghz-up-to-5-4ghz-12-cores-24-threads-am5",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-7-7700x-8-nhan-16-luong-boost-5-4-ghz-40-mb-cache-tdp-105w
  {
    id: "cpu-amd-ryzen-7-7700x", name: "AMD Ryzen 7 7700X", vendor: "amd", priceVnd: 9290000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 4.5,
    boostClockGhz: 5.4, cacheText: "L1 512 KB, L2 8 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
    tdpW: 105, psuPowerW: 142, passmarkRaw: 35470, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-7700x.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-7-7700x-8-nhan-16-luong-boost-5-4-ghz-40-mb-cache-tdp-105w",
  },
  // Source: https://phongvu.vn/cpu-amd-ryzen-5-7600x-4-7ghz-boost-to-5-3ghz--s220919570
  {
    id: "cpu-amd-ryzen-5-7600x", name: "AMD Ryzen 5 7600X", vendor: "amd", priceVnd: 6649000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 4.7,
    boostClockGhz: 5.3, cacheText: "L1 384 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
    tdpW: 105, psuPowerW: 142, passmarkRaw: 28252, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-7600x.webp", sourceUrl: "https://phongvu.vn/cpu-amd-ryzen-5-7600x-4-7ghz-boost-to-5-3ghz--s220919570",
  },
  // Source: https://vdstore.vn/products/cpu-amd-ryzen-5-7400f-37ghz-boost-47ghz-6-nhan-12-luong-6mb-am5
  {
    id: "cpu-amd-ryzen-5-7400f", name: "AMD Ryzen 5 7400F", vendor: "amd", priceVnd: 3090000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 5nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.7,
    boostClockGhz: 4.7, cacheText: "L1 384 KB, L2 6 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 25643, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-7400f.webp", sourceUrl: "https://vdstore.vn/products/cpu-amd-ryzen-5-7400f-37ghz-boost-47ghz-6-nhan-12-luong-6mb-am5",
  },
  // Source: https://memoryzone.com.vn/cpu-amd-ryzen-7-8700f-up-to-5ghz-8-cores-16-threads-16mb-100-100001590box
  {
    id: "cpu-amd-ryzen-7-8700f", name: "AMD Ryzen 7 8700F", vendor: "amd", priceVnd: 7990000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 4.1,
    boostClockGhz: 5, cacheText: "L1 512 KB, L2 8 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 30818, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-8700f.webp", sourceUrl: "https://memoryzone.com.vn/cpu-amd-ryzen-7-8700f-up-to-5ghz-8-cores-16-threads-16mb-100-100001590box",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8400f
  {
    id: "cpu-amd-ryzen-5-8400f", name: "AMD Ryzen 5 8400F", vendor: "amd", priceVnd: 4490000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 4.2,
    boostClockGhz: 4.7, cacheText: "L1 384 KB, L2 6 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 24352, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-8400f.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8400f",
  },
  // Source: https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8500g
  {
    id: "cpu-amd-ryzen-5-8500g", name: "AMD Ryzen 5 8500G", vendor: "amd", priceVnd: 4190000,
    architecture: "Zen 4", socket: "AM5", processNode: "TSMC 4nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.5,
    boostClockGhz: 5, cacheText: "L1 384 KB, L2 6 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR5-5200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 21343, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-8500g.webp", sourceUrl: "https://gearvn.com/products/bo-vi-xu-ly-amd-ryzen-5-8500g",
  },
  // Source: https://bpstore.vn/products/cpu-intel-core-i9-13900k-intel-lga1700-24-core-32-thread-base-3-0ghz-turbo-5-8ghz-cache-36mb
  {
    id: "cpu-intel-core-i9-13900k", name: "Intel Core i9-13900K", vendor: "intel", priceVnd: 11550000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 3,
    boostClockGhz: 5.8, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 58021, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-13900k.webp", sourceUrl: "https://bpstore.vn/products/cpu-intel-core-i9-13900k-intel-lga1700-24-core-32-thread-base-3-0ghz-turbo-5-8ghz-cache-36mb",
  },
  // Source: https://bpstore.vn/products/nhan-ban-tu-cpu-intel-core-i9-13900kf-intel-lga1700-24-core-32-thread-base-3-0ghz-turbo-5-8ghz-cache-36mb
  {
    id: "cpu-intel-core-i9-13900kf", name: "Intel Core i9-13900KF", vendor: "intel", priceVnd: 11050000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 24,
    threadsTotal: 32, pCores: 8, eCores: 16, baseClockGhz: 3,
    boostClockGhz: 5.8, cacheText: "L1 2176 KB, L2 32 MB, L3 36 MB", l3CacheMb: 36.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 57388, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-13900kf.webp", sourceUrl: "https://bpstore.vn/products/nhan-ban-tu-cpu-intel-core-i9-13900kf-intel-lga1700-24-core-32-thread-base-3-0ghz-turbo-5-8ghz-cache-36mb",
  },
  // Source: https://tinhocngoisao.com/products/cpu-intel-core-i7-13700k-tray-vat-no-box-lga1700-16-nhan-24-luong-max-5-4ghz
  {
    id: "cpu-intel-core-i7-13700k", name: "Intel Core i7-13700K", vendor: "intel", priceVnd: 10990000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 16,
    threadsTotal: 24, pCores: 8, eCores: 8, baseClockGhz: 3.4,
    boostClockGhz: 5.4, cacheText: "L1 1408 KB, L2 24 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 45565, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-13700k.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-intel-core-i7-13700k-tray-vat-no-box-lga1700-16-nhan-24-luong-max-5-4ghz",
  },
  // Source: https://hotgear.vn/products/intel-core-i7-13700kf-core-i7-13th-gen-raptor-lake-16-core-8p-8e-p-core-base-frequency-3-4-ghz-e-core-base-frequency-2-5-ghz-lga-1700-125w-desktop-processor
  {
    id: "cpu-intel-core-i7-13700kf", name: "Intel Core i7-13700KF", vendor: "intel", priceVnd: 8490000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 16,
    threadsTotal: 24, pCores: 8, eCores: 8, baseClockGhz: 3.4,
    boostClockGhz: 5.4, cacheText: "L1 1408 KB, L2 24 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 253, passmarkRaw: 45485, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-13700kf.webp", sourceUrl: "https://hotgear.vn/products/intel-core-i7-13700kf-core-i7-13th-gen-raptor-lake-16-core-8p-8e-p-core-base-frequency-3-4-ghz-e-core-base-frequency-2-5-ghz-lga-1700-125w-desktop-processor",
  },
  // Source: https://hotgear.vn/products/intel-core-i5-13600k-3-5ghz-turbo-5-1ghz-14-nhan-20-luong-24mb-lga-1700
  {
    id: "cpu-intel-core-i5-13600k", name: "Intel Core i5-13600K", vendor: "intel", priceVnd: 5450000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 3.5,
    boostClockGhz: 5.1, cacheText: "L1 1248 KB, L2 20 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 181, passmarkRaw: 37427, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-13600k.webp", sourceUrl: "https://hotgear.vn/products/intel-core-i5-13600k-3-5ghz-turbo-5-1ghz-14-nhan-20-luong-24mb-lga-1700",
  },
  // Source: https://hotgear.vn/products/intel-core-i5-13600kf-core-i5-13th-gen-raptor-lake-14-core-6p-8e-3-5-ghz-lga-1700-125w-desktop-processor
  {
    id: "cpu-intel-core-i5-13600kf", name: "Intel Core i5-13600KF", vendor: "intel", priceVnd: 4999000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 3.5,
    boostClockGhz: 5.1, cacheText: "L1 1248 KB, L2 20 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-5600 / DDR4-3200",
    tdpW: 125, psuPowerW: 181, passmarkRaw: 37285, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-13600kf.webp", sourceUrl: "https://hotgear.vn/products/intel-core-i5-13600kf-core-i5-13th-gen-raptor-lake-14-core-6p-8e-3-5-ghz-lga-1700-125w-desktop-processor",
  },
  // Source: https://hotgear.vn/products/cpu-intel-core-i5-13500-14-cores-20-threads-24mb-up-to-4-8ghz-box-chinh-hang
  {
    id: "cpu-intel-core-i5-13500", name: "Intel Core i5-13500", vendor: "intel", priceVnd: 5790000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 14,
    threadsTotal: 20, pCores: 6, eCores: 8, baseClockGhz: 2.5,
    boostClockGhz: 4.8, cacheText: "L1 1248 KB, L2 11.5 MB, L3 24 MB", l3CacheMb: 24.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 154, passmarkRaw: 30620, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-13500.webp", sourceUrl: "https://hotgear.vn/products/cpu-intel-core-i5-13500-14-cores-20-threads-24mb-up-to-4-8ghz-box-chinh-hang",
  },
  // Source: https://tinhocngoisao.com/products/cpu-intel-core-i3-13100f-4-cores-8-threads-12mb-up-to-4-5ghz-box-chinh-hang-bx8071513100f
  {
    id: "cpu-intel-core-i3-13100f", name: "Intel Core i3-13100F", vendor: "intel", priceVnd: 2690000,
    architecture: "Raptor Lake", socket: "LGA1700", processNode: "Intel 7", coresTotal: 4,
    threadsTotal: 8, pCores: null, eCores: null, baseClockGhz: 3.4,
    boostClockGhz: 4.5, cacheText: "L1 320 KB, L2 5 MB, L3 12 MB", l3CacheMb: 12.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 58, psuPowerW: 89, passmarkRaw: 14650, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i3-13100f.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-intel-core-i3-13100f-4-cores-8-threads-12mb-up-to-4-5ghz-box-chinh-hang-bx8071513100f",
  },
  // Source: https://bpstore.vn/products/cpu-intel-core-i9-12900k-intel-lga1700-16-core-24-thread-base-3-2ghz-turbo-5-2ghz-cache-30mb
  {
    id: "cpu-intel-core-i9-12900k", name: "Intel Core i9-12900K", vendor: "intel", priceVnd: 9490000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 16,
    threadsTotal: 24, pCores: 8, eCores: 8, baseClockGhz: 3.2,
    boostClockGhz: 5.2, cacheText: "L1 1408 KB, L2 14 MB, L3 30 MB", l3CacheMb: 30.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 125, psuPowerW: 241, passmarkRaw: 41085, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i9-12900k.webp", sourceUrl: "https://bpstore.vn/products/cpu-intel-core-i9-12900k-intel-lga1700-16-core-24-thread-base-3-2ghz-turbo-5-2ghz-cache-30mb",
  },
  // Source: https://hotgear.vn/products/intel-core-i7-12700k-3-6ghz-turbo-5-0ghz-12-nhan-20-luong-25mb-lga-1700-box
  {
    id: "cpu-intel-core-i7-12700k", name: "Intel Core i7-12700K", vendor: "intel", priceVnd: 5790000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 12,
    threadsTotal: 20, pCores: 8, eCores: 4, baseClockGhz: 3.6,
    boostClockGhz: 5, cacheText: "L1 1024 KB, L2 12 MB, L3 25 MB", l3CacheMb: 25.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 125, psuPowerW: 190, passmarkRaw: 34222, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-12700k.webp", sourceUrl: "https://hotgear.vn/products/intel-core-i7-12700k-3-6ghz-turbo-5-0ghz-12-nhan-20-luong-25mb-lga-1700-box",
  },
  // Source: https://hotgear.vn/products/intel-core-i7-12700kf-up-to-5-00ghz-12-nhan-20-luong-25m-cache-alder-lake
  {
    id: "cpu-intel-core-i7-12700kf", name: "Intel Core i7-12700KF", vendor: "intel", priceVnd: 5490000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 12,
    threadsTotal: 20, pCores: 8, eCores: 4, baseClockGhz: 3.6,
    boostClockGhz: 5, cacheText: "L1 1024 KB, L2 12 MB, L3 25 MB", l3CacheMb: 25.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 125, psuPowerW: 190, passmarkRaw: 33869, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i7-12700kf.webp", sourceUrl: "https://hotgear.vn/products/intel-core-i7-12700kf-up-to-5-00ghz-12-nhan-20-luong-25m-cache-alder-lake",
  },
  // Source: https://tinhocngoisao.com/products/cpu-intel-core-i5-12600k-box-chinh-hang-3-70-up-to-4-90ghz
  {
    id: "cpu-intel-core-i5-12600k", name: "Intel Core i5-12600K", vendor: "intel", priceVnd: 5790000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 10,
    threadsTotal: 16, pCores: 6, eCores: 4, baseClockGhz: 3.7,
    boostClockGhz: 4.9, cacheText: "L1 864 KB, L2 9.5 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 125, psuPowerW: 150, passmarkRaw: 27502, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-12600k.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-intel-core-i5-12600k-box-chinh-hang-3-70-up-to-4-90ghz",
  },
  // Source: https://hotgear.vn/products/intel-core-i5-12600kf-3-7ghz-turbo-4-9ghz-10-nhan-16-luong-20mb-lga-1700
  {
    id: "cpu-intel-core-i5-12600kf", name: "Intel Core i5-12600KF", vendor: "intel", priceVnd: 4990000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 10,
    threadsTotal: 16, pCores: 6, eCores: 4, baseClockGhz: 3.7,
    boostClockGhz: 4.9, cacheText: "L1 864 KB, L2 9.5 MB, L3 20 MB", l3CacheMb: 20.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 125, psuPowerW: 150, passmarkRaw: 27496, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-12600kf.webp", sourceUrl: "https://hotgear.vn/products/intel-core-i5-12600kf-3-7ghz-turbo-4-9ghz-10-nhan-16-luong-20mb-lga-1700",
  },
  // Source: https://tinhocngoisao.com/products/cpu-intel-core-i5-12400-tray-chinh-hang-no-box
  {
    id: "cpu-intel-core-i5-12400", name: "Intel Core i5-12400", vendor: "intel", priceVnd: 4250000,
    architecture: "Alder Lake-S", socket: "LGA1700", processNode: "Intel 7", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 2.5,
    boostClockGhz: 4.4, cacheText: "L1 480 KB, L2 7.5 MB, L3 18 MB", l3CacheMb: 18.0, ramSupport: "DDR5-4800 / DDR4-3200",
    tdpW: 65, psuPowerW: 117, passmarkRaw: 18838, passmarkSource: "PassMark",
    imageFile: "cpu-intel-core-i5-12400.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-intel-core-i5-12400-tray-chinh-hang-no-box",
  },
  // Source: https://hotgear.vn/products/amd-ryzen-9-5950x-3-4-ghz-4-9ghz-max-boost-72mb-cache-16-cores-32-threads-105w-socket-am4
  {
    id: "cpu-amd-ryzen-9-5950x", name: "AMD Ryzen 9 5950X", vendor: "amd", priceVnd: 7990000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 16,
    threadsTotal: 32, pCores: null, eCores: null, baseClockGhz: 3.4,
    boostClockGhz: 4.9, cacheText: "L1 1024 KB, L2 8 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR4-3200",
    tdpW: 105, psuPowerW: 142, passmarkRaw: 45227, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-5950x.webp", sourceUrl: "https://hotgear.vn/products/amd-ryzen-9-5950x-3-4-ghz-4-9ghz-max-boost-72mb-cache-16-cores-32-threads-105w-socket-am4",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-9-5900x.html
  {
    id: "cpu-amd-ryzen-9-5900x", name: "AMD Ryzen 9 5900X", vendor: "amd", priceVnd: 8500000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 12,
    threadsTotal: 24, pCores: null, eCores: null, baseClockGhz: 3.7,
    boostClockGhz: 4.8, cacheText: "L1 768 KB, L2 6 MB, L3 64 MB", l3CacheMb: 64.0, ramSupport: "DDR4-3200",
    tdpW: 105, psuPowerW: 142, passmarkRaw: 38880, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-9-5900x.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-9-5900x.html",
  },
  // Source: https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-7-5800x.html
  {
    id: "cpu-amd-ryzen-7-5800x", name: "AMD Ryzen 7 5800X", vendor: "amd", priceVnd: 6350000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 3.8,
    boostClockGhz: 4.7, cacheText: "L1 512 KB, L2 4 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR4-3200",
    tdpW: 105, psuPowerW: 142, passmarkRaw: 27649, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-5800x.webp", sourceUrl: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-7-5800x.html",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-7-5700x-chinh-hang-no-box-100-000000926
  {
    id: "cpu-amd-ryzen-7-5700x", name: "AMD Ryzen 7 5700X", vendor: "amd", priceVnd: 4990000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 3.4,
    boostClockGhz: 4.6, cacheText: "L1 512 KB, L2 4 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 26536, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-5700x.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-7-5700x-chinh-hang-no-box-100-000000926",
  },
  // Source: https://memoryzone.com.vn/cpu-amd-ryzen-5-5600x-3-7ghz-6-cores-12-threads-32mb-100-100000065box
  {
    id: "cpu-amd-ryzen-5-5600x", name: "AMD Ryzen 5 5600X", vendor: "amd", priceVnd: 3790000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.7,
    boostClockGhz: 4.6, cacheText: "L1 384 KB, L2 3 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 21820, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-5600x.webp", sourceUrl: "https://memoryzone.com.vn/cpu-amd-ryzen-5-5600x-3-7ghz-6-cores-12-threads-32mb-100-100000065box",
  },
  // Source: https://hotgear.vn/products/cpu-amd-ryzen-5-5600-3-5ghz-6-cores-12-threads
  {
    id: "cpu-amd-ryzen-5-5600", name: "AMD Ryzen 5 5600", vendor: "amd", priceVnd: 2890000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.5,
    boostClockGhz: 4.4, cacheText: "L1 384 KB, L2 3 MB, L3 32 MB", l3CacheMb: 32.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 21489, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-5600.webp", sourceUrl: "https://hotgear.vn/products/cpu-amd-ryzen-5-5600-3-5ghz-6-cores-12-threads",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-5-5500-up-to-4-2ghz-6-cores-12-threads-box-chinh-hang
  {
    id: "cpu-amd-ryzen-5-5500", name: "AMD Ryzen 5 5500", vendor: "amd", priceVnd: 2350000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.6,
    boostClockGhz: 4.2, cacheText: "L1 384 KB, L2 3 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 19246, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-5500.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-5-5500-up-to-4-2ghz-6-cores-12-threads-box-chinh-hang",
  },
  // Source: https://tinhocngoisao.com/products/cpu-amd-ryzen-5-5600g-3-9ghz-up-to-4-4ghz-am4-6-cores-12-threads-box-chinh-hang
  {
    id: "cpu-amd-ryzen-5-5600g", name: "AMD Ryzen 5 5600G", vendor: "amd", priceVnd: 3790000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.9,
    boostClockGhz: 4.4, cacheText: "L1 384 KB, L2 3 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 19614, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-5600g.webp", sourceUrl: "https://tinhocngoisao.com/products/cpu-amd-ryzen-5-5600g-3-9ghz-up-to-4-4ghz-am4-6-cores-12-threads-box-chinh-hang",
  },
  // Source: https://memoryzone.com.vn/cpu-amd-ryzen-7-5700g-mpk-3-8ghz-8-cores-16-threads-16mb-100-100000263mpk
  {
    id: "cpu-amd-ryzen-7-5700g", name: "AMD Ryzen 7 5700G", vendor: "amd", priceVnd: 5490000,
    architecture: "Zen 3", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 8,
    threadsTotal: 16, pCores: null, eCores: null, baseClockGhz: 3.8,
    boostClockGhz: 4.6, cacheText: "L1 512 KB, L2 4 MB, L3 16 MB", l3CacheMb: 16.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 24203, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-7-5700g.webp", sourceUrl: "https://memoryzone.com.vn/cpu-amd-ryzen-7-5700g-mpk-3-8ghz-8-cores-16-threads-16mb-100-100000263mpk",
  },
  // Source: https://hotgear.vn/products/cpu-amd-ryzen-5-4500-mpk-3-6ghz-6-cores-12-threads-tray
  {
    id: "cpu-amd-ryzen-5-4500", name: "AMD Ryzen 5 4500", vendor: "amd", priceVnd: 1999000,
    architecture: "Zen 2", socket: "AM4", processNode: "TSMC 7nm FinFET", coresTotal: 6,
    threadsTotal: 12, pCores: null, eCores: null, baseClockGhz: 3.6,
    boostClockGhz: 4.1, cacheText: "L1 384 KB, L2 3 MB, L3 8 MB", l3CacheMb: 8.0, ramSupport: "DDR4-3200",
    tdpW: 65, psuPowerW: 88, passmarkRaw: 15915, passmarkSource: "PassMark",
    imageFile: "cpu-amd-ryzen-5-4500.webp", sourceUrl: "https://hotgear.vn/products/cpu-amd-ryzen-5-4500-mpk-3-6ghz-6-cores-12-threads-tray",
  },
];
