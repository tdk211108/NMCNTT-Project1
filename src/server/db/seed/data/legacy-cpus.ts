import 'server-only';

import type { LegacyCpuSeed } from '../types';

export const LEGACY_CPU_SEEDS: readonly LegacyCpuSeed[] = [
  // Source: https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review
  {
    id: "C01", name: "Intel Core i9-11900K", vendor: "intel", socket: "LGA1200",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 250, sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review",
  },
  // Source: https://www.tomshardware.com/reviews/intel-core-i7-11700k-cpu-review
  {
    id: "C02", name: "Intel Core i7-11700K", vendor: "intel", socket: "LGA1200",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 251, sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i7-11700k-cpu-review",
  },
  // Source: https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review
  {
    id: "C03", name: "Intel Core i5-11600K", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 251, sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review",
  },
  // Source: https://www.tomshardware.com/reviews/intel-core-i5-11400-review
  {
    id: "C04", name: "Intel Core i5-11400F", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 154, sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i5-11400-review",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i9-10900k.c2266
  {
    id: "C05", name: "Intel Core i9-10900K", vendor: "intel", socket: "LGA1200",
    coresTotal: 10, threadsTotal: 20, psuPowerW: 250, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i9-10900k.c2266",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i7-10700k.c2215
  {
    id: "C06", name: "Intel Core i7-10700K", vendor: "intel", socket: "LGA1200",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 229, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i7-10700k.c2215",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i5-10400f.c2270
  {
    id: "C07", name: "Intel Core i5-10400F", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 134, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i5-10400f.c2270",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i3-10100f.c4600
  {
    id: "C08", name: "Intel Core i3-10100F", vendor: "intel", socket: "LGA1200",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 90, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i3-10100f.c4600",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i7-9700k.c2097
  {
    id: "C09", name: "Intel Core i7-9700K", vendor: "intel", socket: "LGA1151",
    coresTotal: 8, threadsTotal: 8, psuPowerW: 119, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i7-9700k.c2097",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i5-9400f.c2145
  {
    id: "C10", name: "Intel Core i5-9400F", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 6, psuPowerW: 81, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i5-9400f.c2145",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i7-8700k.c1947
  {
    id: "C11", name: "Intel Core i7-8700K", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 119, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i7-8700k.c1947",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i5-8400.c1964
  {
    id: "C12", name: "Intel Core i5-8400", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 6, psuPowerW: 81, sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i5-8400.c1964",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-9-5950x.c2364
  {
    id: "C13", name: "AMD Ryzen 9 5950X", vendor: "amd", socket: "AM4",
    coresTotal: 16, threadsTotal: 32, psuPowerW: 142, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-9-5950x.c2364",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-9-5900x.c2363
  {
    id: "C14", name: "AMD Ryzen 9 5900X", vendor: "amd", socket: "AM4",
    coresTotal: 12, threadsTotal: 24, psuPowerW: 142, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-9-5900x.c2363",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-5800x3d.c2532
  {
    id: "C15", name: "AMD Ryzen 7 5800X3D", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-5800x3d.c2532",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-5800x.c2362
  {
    id: "C16", name: "AMD Ryzen 7 5800X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-5800x.c2362",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-5700x.c2755
  {
    id: "C17", name: "AMD Ryzen 7 5700X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 88, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-5700x.c2755",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-5600x.c2365
  {
    id: "C18", name: "AMD Ryzen 5 5600X", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-5600x.c2365",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-5600.c2743
  {
    id: "C19", name: "AMD Ryzen 5 5600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-5600.c2743",
  },
  // Source: https://www.tomshardware.com/pc-components/cpus/100-budget-cpu-shootout-ddr4
  {
    id: "C20", name: "AMD Ryzen 5 5500", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, sourceUrl: "https://www.tomshardware.com/pc-components/cpus/100-budget-cpu-shootout-ddr4",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-3700x.c2130
  {
    id: "C21", name: "AMD Ryzen 7 3700X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 88, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-3700x.c2130",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-3600.c2132
  {
    id: "C22", name: "AMD Ryzen 5 3600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-3600.c2132",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-2700x.c2011
  {
    id: "C23", name: "AMD Ryzen 7 2700X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-2700x.c2011",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-2600.c2015
  {
    id: "C24", name: "AMD Ryzen 5 2600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-2600.c2015",
  },
];
