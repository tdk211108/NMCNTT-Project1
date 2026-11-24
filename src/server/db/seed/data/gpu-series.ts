import 'server-only';

import type { RetailGpuSeriesSeed } from '../types';

export const RETAIL_GPU_SERIES_SEEDS: readonly RetailGpuSeriesSeed[] = [
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+5090&id=5725
  {
    id: "gs-rtx-5090", kind: "retail", name: "NVIDIA GeForce RTX 5090", vendor: "nvidia",
    vramGb: 32, cores: 21760, baseClockMhz: 2017, boostClockMhz: 2407,
    memoryType: "GDDR7", busWidthBit: 512, tbpW: 575, passmarkRaw: 39031,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+5090&id=5725",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+5080&id=5721
  {
    id: "gs-rtx-5080", kind: "retail", name: "NVIDIA GeForce RTX 5080", vendor: "nvidia",
    vramGb: 16, cores: 10752, baseClockMhz: 2295, boostClockMhz: 2617,
    memoryType: "GDDR7", busWidthBit: 256, tbpW: 360, passmarkRaw: 35660,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+5080&id=5721",
  },
  // Source: https://www.videocardbenchmark.net/gpu_list.php
  {
    id: "gs-rtx-5070-ti", kind: "retail", name: "NVIDIA GeForce RTX 5070 Ti", vendor: "nvidia",
    vramGb: 16, cores: 8960, baseClockMhz: 2295, boostClockMhz: 2452,
    memoryType: "GDDR7", busWidthBit: 256, tbpW: 300, passmarkRaw: 32336,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu_list.php",
  },
  // Source: https://www.videocardbenchmark.net/gpu_list.php
  {
    id: "gs-rtx-5070", kind: "retail", name: "NVIDIA GeForce RTX 5070", vendor: "nvidia",
    vramGb: 12, cores: 6144, baseClockMhz: 2160, boostClockMhz: 2510,
    memoryType: "GDDR7", busWidthBit: 192, tbpW: 250, passmarkRaw: 28682,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu_list.php",
  },
  // Source: https://www.videocardbenchmark.net/compare/5725vs5721vs6160/GeForce-RTX-5090-vs-GeForce-RTX-5080-vs-GeForce-RTX-5060-Ti-16GB
  {
    id: "gs-rtx-5060-ti-16gb", kind: "retail", name: "NVIDIA GeForce RTX 5060 Ti 16GB", vendor: "nvidia",
    vramGb: 16, cores: 4608, baseClockMhz: 2407, boostClockMhz: 2572,
    memoryType: "GDDR7", busWidthBit: 128, tbpW: 180, passmarkRaw: 22638,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/compare/5725vs5721vs6160/GeForce-RTX-5090-vs-GeForce-RTX-5080-vs-GeForce-RTX-5060-Ti-16GB",
  },
  // Source: https://www.videocardbenchmark.net/gpu_list.php
  {
    id: "gs-rtx-5060-ti-8gb", kind: "retail", name: "NVIDIA GeForce RTX 5060 Ti 8GB", vendor: "nvidia",
    vramGb: 8, cores: 4608, baseClockMhz: 2407, boostClockMhz: 2572,
    memoryType: "GDDR7", busWidthBit: 128, tbpW: 180, passmarkRaw: 21773,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu_list.php",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+5060&id=5602
  {
    id: "gs-rtx-5060", kind: "retail", name: "NVIDIA GeForce RTX 5060", vendor: "nvidia",
    vramGb: 8, cores: 3840, baseClockMhz: 2280, boostClockMhz: 2497,
    memoryType: "GDDR7", busWidthBit: 128, tbpW: 145, passmarkRaw: 20581,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+5060&id=5602",
  },
  // Source: https://www.videocardbenchmark.net/compare/6668vs5602vs5957vs5306vs4345/GeForce-RTX-5050-vs-GeForce-RTX-5060-vs-Radeon-RX-9060-XT-16GB-vs-Intel-Arc-B580-vs-GeForce-RTX-3060-12GB
  {
    id: "gs-rtx-5050", kind: "retail", name: "NVIDIA GeForce RTX 5050", vendor: "nvidia",
    vramGb: 8, cores: 2560, baseClockMhz: 2310, boostClockMhz: 2572,
    memoryType: "GDDR6", busWidthBit: 128, tbpW: 130, passmarkRaw: 16696,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/compare/6668vs5602vs5957vs5306vs4345/GeForce-RTX-5050-vs-GeForce-RTX-5060-vs-Radeon-RX-9060-XT-16GB-vs-Intel-Arc-B580-vs-GeForce-RTX-3060-12GB",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9070+XT&id=5956
  {
    id: "gs-rx-9070-xt", kind: "retail", name: "AMD Radeon RX 9070 XT", vendor: "amd",
    vramGb: 16, cores: 4096, baseClockMhz: 1660, boostClockMhz: 2970,
    memoryType: "GDDR6", busWidthBit: 256, tbpW: 304, passmarkRaw: 26927,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9070+XT&id=5956",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9070&id=5958
  {
    id: "gs-rx-9070", kind: "retail", name: "AMD Radeon RX 9070", vendor: "amd",
    vramGb: 16, cores: 3584, baseClockMhz: 1330, boostClockMhz: 2520,
    memoryType: "GDDR6", busWidthBit: 256, tbpW: 220, passmarkRaw: 25373,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9070&id=5958",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9070+GRE&id=6421
  {
    id: "gs-rx-9070-gre", kind: "retail", name: "AMD Radeon RX 9070 GRE", vendor: "amd",
    vramGb: 12, cores: 3072, baseClockMhz: 1420, boostClockMhz: 2790,
    memoryType: "GDDR6", busWidthBit: 192, tbpW: 220, passmarkRaw: 23295,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9070+GRE&id=6421",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9060+XT+16GB&id=5957
  {
    id: "gs-rx-9060-xt-16gb", kind: "retail", name: "AMD Radeon RX 9060 XT 16GB", vendor: "amd",
    vramGb: 16, cores: 2048, baseClockMhz: 1700, boostClockMhz: 3130,
    memoryType: "GDDR6", busWidthBit: 128, tbpW: 160, passmarkRaw: 20150,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9060+XT+16GB&id=5957",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9060+XT+8GB&id=6575
  {
    id: "gs-rx-9060-xt-8gb", kind: "retail", name: "AMD Radeon RX 9060 XT 8GB", vendor: "amd",
    vramGb: 8, cores: 2048, baseClockMhz: 1700, boostClockMhz: 3130,
    memoryType: "GDDR6", busWidthBit: 128, tbpW: 150, passmarkRaw: 19710,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9060+XT+8GB&id=6575",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9050&id=9526
  {
    id: "gs-rx-9050", kind: "retail", name: "AMD Radeon RX 9050", vendor: "amd",
    vramGb: 8, cores: 1024, baseClockMhz: 1920, boostClockMhz: 2600,
    memoryType: "GDDR6", busWidthBit: 128, tbpW: 92, passmarkRaw: 11918,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+9050&id=9526",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+B580&id=5306
  {
    id: "gs-arc-b580", kind: "retail", name: "Intel Arc B580", vendor: "intel",
    vramGb: 12, cores: 2560, baseClockMhz: 2670, boostClockMhz: 2670,
    memoryType: "GDDR6", busWidthBit: 192, tbpW: 190, passmarkRaw: 16097,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+B580&id=5306",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+B570&id=5652
  {
    id: "gs-arc-b570", kind: "retail", name: "Intel Arc B570", vendor: "intel",
    vramGb: 10, cores: 2304, baseClockMhz: 2500, boostClockMhz: 2500,
    memoryType: "GDDR6", busWidthBit: 160, tbpW: 150, passmarkRaw: 14214,
    passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+B570&id=5652",
  },
];
