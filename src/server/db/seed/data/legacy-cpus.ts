import 'server-only';

import type { LegacyCpuSeed } from '../types';

export const LEGACY_CPU_SEEDS: readonly LegacyCpuSeed[] = [
  // Source: https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review
  {
    id: "C01", name: "Intel Core i9-11900K", vendor: "intel", socket: "LGA1200",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 250, passmarkRaw: 24883, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review",
  },
  // Source: https://www.tomshardware.com/reviews/intel-core-i7-11700k-cpu-review
  {
    id: "C02", name: "Intel Core i7-11700K", vendor: "intel", socket: "LGA1200",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 251, passmarkRaw: 24304, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i7-11700k-cpu-review",
  },
  // Source: https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review
  {
    id: "C03", name: "Intel Core i5-11600K", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 251, passmarkRaw: 19474, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i9-11900k-and-i5-11600k-review",
  },
  // Source: https://www.tomshardware.com/reviews/intel-core-i5-11400-review
  {
    id: "C04", name: "Intel Core i5-11400F", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 154, passmarkRaw: 16864, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/reviews/intel-core-i5-11400-review",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i9-10900k.c2266
  {
    id: "C05", name: "Intel Core i9-10900K", vendor: "intel", socket: "LGA1200",
    coresTotal: 10, threadsTotal: 20, psuPowerW: 250, passmarkRaw: 22206, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i9-10900k.c2266",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i7-10700k.c2215
  {
    id: "C06", name: "Intel Core i7-10700K", vendor: "intel", socket: "LGA1200",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 229, passmarkRaw: 18474, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i7-10700k.c2215",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i5-10400f.c2270
  {
    id: "C07", name: "Intel Core i5-10400F", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 134, passmarkRaw: 12092, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i5-10400f.c2270",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i3-10100f.c4600
  {
    id: "C08", name: "Intel Core i3-10100F", vendor: "intel", socket: "LGA1200",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 90, passmarkRaw: 8702, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i3-10100f.c4600",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i7-9700k.c2097
  {
    id: "C09", name: "Intel Core i7-9700K", vendor: "intel", socket: "LGA1151",
    coresTotal: 8, threadsTotal: 8, psuPowerW: 119, passmarkRaw: 14397, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i7-9700k.c2097",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i5-9400f.c2145
  {
    id: "C10", name: "Intel Core i5-9400F", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 6, psuPowerW: 81, passmarkRaw: 9463, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i5-9400f.c2145",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i7-8700k.c1947
  {
    id: "C11", name: "Intel Core i7-8700K", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 119, passmarkRaw: 13553, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i7-8700k.c1947",
  },
  // Source: https://www.techpowerup.com/cpu-specs/core-i5-8400.c1964
  {
    id: "C12", name: "Intel Core i5-8400", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 6, psuPowerW: 81, passmarkRaw: 9236, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/core-i5-8400.c1964",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-9-5950x.c2364
  {
    id: "C13", name: "AMD Ryzen 9 5950X", vendor: "amd", socket: "AM4",
    coresTotal: 16, threadsTotal: 32, psuPowerW: 142, passmarkRaw: 45227, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-9-5950x.c2364",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-9-5900x.c2363
  {
    id: "C14", name: "AMD Ryzen 9 5900X", vendor: "amd", socket: "AM4",
    coresTotal: 12, threadsTotal: 24, psuPowerW: 142, passmarkRaw: 38880, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-9-5900x.c2363",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-5800x3d.c2532
  {
    id: "C15", name: "AMD Ryzen 7 5800X3D", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, passmarkRaw: 28292, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-5800x3d.c2532",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-5800x.c2362
  {
    id: "C16", name: "AMD Ryzen 7 5800X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, passmarkRaw: 27649, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-5800x.c2362",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-5700x.c2755
  {
    id: "C17", name: "AMD Ryzen 7 5700X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 88, passmarkRaw: 26536, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-5700x.c2755",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-5600x.c2365
  {
    id: "C18", name: "AMD Ryzen 5 5600X", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 21820, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-5600x.c2365",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-5600.c2743
  {
    id: "C19", name: "AMD Ryzen 5 5600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 21489, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-5600.c2743",
  },
  // Source: https://www.tomshardware.com/pc-components/cpus/100-budget-cpu-shootout-ddr4
  {
    id: "C20", name: "AMD Ryzen 5 5500", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 19246, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/pc-components/cpus/100-budget-cpu-shootout-ddr4",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-3700x.c2130
  {
    id: "C21", name: "AMD Ryzen 7 3700X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 88, passmarkRaw: 22373, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-3700x.c2130",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-3600.c2132
  {
    id: "C22", name: "AMD Ryzen 5 3600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 17643, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-3600.c2132",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-7-2700x.c2011
  {
    id: "C23", name: "AMD Ryzen 7 2700X", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, passmarkRaw: 17407, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-7-2700x.c2011",
  },
  // Source: https://www.techpowerup.com/cpu-specs/ryzen-5-2600.c2015
  {
    id: "C24", name: "AMD Ryzen 5 2600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 13117, passmarkSource: "PassMark", sourceUrl: "https://www.techpowerup.com/cpu-specs/ryzen-5-2600.c2015",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+7+5700X3D&id=5884
  {
    id: "C25", name: "AMD Ryzen 7 5700X3D", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 142, passmarkRaw: 26307, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+7+5700X3D&id=5884",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+5600G&id=4325
  {
    id: "C26", name: "AMD Ryzen 5 5600G", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 19614, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+5600G&id=4325",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+7+5700G&id=4323
  {
    id: "C27", name: "AMD Ryzen 7 5700G", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 88, passmarkRaw: 24203, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+7+5700G&id=4323",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+3500X&id=3592
  {
    id: "C28", name: "AMD Ryzen 5 3500X", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 6, psuPowerW: 88, passmarkRaw: 13160, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+3500X&id=3592",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-13600K&id=5008
  {
    id: "C29", name: "Intel Core i5-13600K", vendor: "intel", socket: "LGA1700",
    coresTotal: 14, threadsTotal: 20, psuPowerW: 181, passmarkRaw: 37427, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-13600K&id=5008",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-13600KF&id=5059
  {
    id: "C30", name: "Intel Core i5-13600KF", vendor: "intel", socket: "LGA1700",
    coresTotal: 14, threadsTotal: 20, psuPowerW: 181, passmarkRaw: 37285, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-13600KF&id=5059",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-13700K&id=5060
  {
    id: "C31", name: "Intel Core i7-13700K", vendor: "intel", socket: "LGA1700",
    coresTotal: 16, threadsTotal: 24, psuPowerW: 253, passmarkRaw: 45565, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-13700K&id=5060",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-13700KF&id=5061
  {
    id: "C32", name: "Intel Core i7-13700KF", vendor: "intel", socket: "LGA1700",
    coresTotal: 16, threadsTotal: 24, psuPowerW: 253, passmarkRaw: 45485, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-13700KF&id=5061",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-13900K&id=5022
  {
    id: "C33", name: "Intel Core i9-13900K", vendor: "intel", socket: "LGA1700",
    coresTotal: 24, threadsTotal: 32, psuPowerW: 253, passmarkRaw: 58021, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-13900K&id=5022",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-13900KF&id=5055
  {
    id: "C34", name: "Intel Core i9-13900KF", vendor: "intel", socket: "LGA1700",
    coresTotal: 24, threadsTotal: 32, psuPowerW: 253, passmarkRaw: 57388, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-13900KF&id=5055",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-13500&id=4993
  {
    id: "C35", name: "Intel Core i5-13500", vendor: "intel", socket: "LGA1700",
    coresTotal: 14, threadsTotal: 20, psuPowerW: 154, passmarkRaw: 30620, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-13500&id=4993",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-13100F&id=5156
  {
    id: "C36", name: "Intel Core i3-13100F", vendor: "intel", socket: "LGA1700",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 89, passmarkRaw: 14650, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-13100F&id=5156",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-12600K&id=4603
  {
    id: "C37", name: "Intel Core i5-12600K", vendor: "intel", socket: "LGA1700",
    coresTotal: 10, threadsTotal: 16, psuPowerW: 150, passmarkRaw: 27502, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-12600K&id=4603",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-12600KF&id=4625
  {
    id: "C38", name: "Intel Core i5-12600KF", vendor: "intel", socket: "LGA1700",
    coresTotal: 10, threadsTotal: 16, psuPowerW: 150, passmarkRaw: 27496, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-12600KF&id=4625",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-12700K&id=4609
  {
    id: "C39", name: "Intel Core i7-12700K", vendor: "intel", socket: "LGA1700",
    coresTotal: 12, threadsTotal: 20, psuPowerW: 190, passmarkRaw: 34222, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-12700K&id=4609",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-12700KF&id=4608
  {
    id: "C40", name: "Intel Core i7-12700KF", vendor: "intel", socket: "LGA1700",
    coresTotal: 12, threadsTotal: 20, psuPowerW: 190, passmarkRaw: 33869, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-12700KF&id=4608",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-12900K&id=4597
  {
    id: "C41", name: "Intel Core i9-12900K", vendor: "intel", socket: "LGA1700",
    coresTotal: 16, threadsTotal: 24, psuPowerW: 241, passmarkRaw: 41085, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-12900K&id=4597",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-12400&id=4677
  {
    id: "C42", name: "Intel Core i5-12400", vendor: "intel", socket: "LGA1700",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 117, passmarkRaw: 18838, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-12400&id=4677",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-9100F+%40+3.60GHz&id=3461
  {
    id: "C43", name: "Intel Core i3-9100F", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 4, psuPowerW: 81, passmarkRaw: 6701, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-9100F+%40+3.60GHz&id=3461",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-9900K+%40+3.60GHz&id=3334
  {
    id: "C44", name: "Intel Core i9-9900K", vendor: "intel", socket: "LGA1151",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 210, passmarkRaw: 18015, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i9-9900K+%40+3.60GHz&id=3334",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-9600K+%40+3.70GHz&id=3337
  {
    id: "C45", name: "Intel Core i5-9600K", vendor: "intel", socket: "LGA1151",
    coresTotal: 6, threadsTotal: 6, psuPowerW: 119, passmarkRaw: 10653, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-9600K+%40+3.70GHz&id=3337",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-8100+%40+3.60GHz&id=3103
  {
    id: "C46", name: "Intel Core i3-8100", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 4, psuPowerW: 65, passmarkRaw: 6053, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-8100+%40+3.60GHz&id=3103",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-10400+%40+2.90GHz&id=3737
  {
    id: "C47", name: "Intel Core i5-10400", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 134, passmarkRaw: 11954, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-10400+%40+2.90GHz&id=3737",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-10100+%40+3.60GHz&id=3717
  {
    id: "C48", name: "Intel Core i3-10100", vendor: "intel", socket: "LGA1200",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 90, passmarkRaw: 8475, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i3-10100+%40+3.60GHz&id=3717",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-11400+%40+2.60GHz&id=4233
  {
    id: "C49", name: "Intel Core i5-11400", vendor: "intel", socket: "LGA1200",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 154, passmarkRaw: 16603, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-11400+%40+2.60GHz&id=4233",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-7700K+%40+4.20GHz&id=2874
  {
    id: "C50", name: "Intel Core i7-7700K", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 119, passmarkRaw: 9632, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-7700K+%40+4.20GHz&id=2874",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-7700+%40+3.60GHz&id=2905
  {
    id: "C51", name: "Intel Core i7-7700", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 83, passmarkRaw: 8635, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-7700+%40+3.60GHz&id=2905",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-7400+%40+3.00GHz&id=2929
  {
    id: "C52", name: "Intel Core i5-7400", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 4, psuPowerW: 81, passmarkRaw: 5482, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-7400+%40+3.00GHz&id=2929",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-6700K+%40+4.00GHz&id=2565
  {
    id: "C53", name: "Intel Core i7-6700K", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 119, passmarkRaw: 8935, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-6700K+%40+4.00GHz&id=2565",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-6500+%40+3.20GHz&id=2599
  {
    id: "C54", name: "Intel Core i5-6500", vendor: "intel", socket: "LGA1151",
    coresTotal: 4, threadsTotal: 4, psuPowerW: 81, passmarkRaw: 5597, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-6500+%40+3.20GHz&id=2599",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+3600X&id=3494
  {
    id: "C55", name: "AMD Ryzen 5 3600X", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 128, passmarkRaw: 18108, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+3600X&id=3494",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+3+3100&id=3715
  {
    id: "C56", name: "AMD Ryzen 3 3100", vendor: "amd", socket: "AM4",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 88, passmarkRaw: 11503, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+3+3100&id=3715",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+3+3300X&id=3716
  {
    id: "C57", name: "AMD Ryzen 3 3300X", vendor: "amd", socket: "AM4",
    coresTotal: 4, threadsTotal: 8, psuPowerW: 88, passmarkRaw: 12578, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+3+3300X&id=3716",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+4500&id=4816
  {
    id: "C58", name: "AMD Ryzen 5 4500", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 15915, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+4500&id=4816",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+4600G&id=3807
  {
    id: "C59", name: "AMD Ryzen 5 4600G", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 15915, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+4600G&id=3807",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+1600&id=2984
  {
    id: "C60", name: "AMD Ryzen 5 1600", vendor: "amd", socket: "AM4",
    coresTotal: 6, threadsTotal: 12, psuPowerW: 88, passmarkRaw: 12239, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+5+1600&id=2984",
  },
  // Source: https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+7+1700&id=2970
  {
    id: "C61", name: "AMD Ryzen 7 1700", vendor: "amd", socket: "AM4",
    coresTotal: 8, threadsTotal: 16, psuPowerW: 88, passmarkRaw: 14726, passmarkSource: "PassMark", sourceUrl: "https://www.cpubenchmark.net/cpu.php?cpu=AMD+Ryzen+7+1700&id=2970",
  },
];
