import 'server-only';

import type { LegacyGpuSeriesSeed } from '../types';

export const LEGACY_GPU_SERIES_SEEDS: readonly LegacyGpuSeriesSeed[] = [
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/
  {
    id: "G01", kind: "legacy", name: "NVIDIA RTX 4090", vendor: "nvidia",
    vramGb: 24, tbpW: 450, passmarkRaw: 38013, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/
  {
    id: "G02", kind: "legacy", name: "NVIDIA RTX 4080 Super", vendor: "nvidia",
    vramGb: 16, tbpW: 320, passmarkRaw: 34216, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/
  {
    id: "G03", kind: "legacy", name: "NVIDIA RTX 4070 Ti Super", vendor: "nvidia",
    vramGb: 16, tbpW: 285, passmarkRaw: 31846, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/
  {
    id: "G04", kind: "legacy", name: "NVIDIA RTX 4070 Super", vendor: "nvidia",
    vramGb: 12, tbpW: 220, passmarkRaw: 29939, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/
  {
    id: "G05", kind: "legacy", name: "NVIDIA RTX 4070", vendor: "nvidia",
    vramGb: 12, tbpW: 200, passmarkRaw: 26850, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/
  {
    id: "G06", kind: "legacy", name: "NVIDIA RTX 4060 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 160, passmarkRaw: 22596, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/
  {
    id: "G07", kind: "legacy", name: "NVIDIA RTX 4060", vendor: "nvidia",
    vramGb: 8, tbpW: 115, passmarkRaw: 19477, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/
  {
    id: "G08", kind: "legacy", name: "NVIDIA RTX 3090", vendor: "nvidia",
    vramGb: 24, tbpW: 350, passmarkRaw: 26456, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/
  {
    id: "G09", kind: "legacy", name: "NVIDIA RTX 3080", vendor: "nvidia",
    vramGb: 10, tbpW: 320, passmarkRaw: 24965, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/
  {
    id: "G10", kind: "legacy", name: "NVIDIA RTX 3070 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 290, passmarkRaw: 23153, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/
  {
    id: "G11", kind: "legacy", name: "NVIDIA RTX 3070", vendor: "nvidia",
    vramGb: 8, tbpW: 220, passmarkRaw: 22059, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/
  {
    id: "G12", kind: "legacy", name: "NVIDIA RTX 3060 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 200, passmarkRaw: 20205, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/",
  },
  // Source: https://www.nvidia.com/content/nvidiaGDC/zz/en_ZZ/geforce/graphics-cards/rtx-2080-ti.html
  {
    id: "G15", kind: "legacy", name: "NVIDIA RTX 2080 Ti", vendor: "nvidia",
    vramGb: 11, tbpW: 250, passmarkRaw: 21396, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/content/nvidiaGDC/zz/en_ZZ/geforce/graphics-cards/rtx-2080-ti.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-RTX-2070-Super-GPU-Benchmarks-and-Specs.426831.0.html
  {
    id: "G16", kind: "legacy", name: "NVIDIA RTX 2070 Super", vendor: "nvidia",
    vramGb: 8, tbpW: 215, passmarkRaw: 18124, passmarkSource: "PassMark", sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-RTX-2070-Super-GPU-Benchmarks-and-Specs.426831.0.html",
  },
  // Source: https://www.tomshardware.com/reviews/nvidia-geforce-rtx-2060-ray-tracing-turing,5960.html
  {
    id: "G17", kind: "legacy", name: "NVIDIA RTX 2060", vendor: "nvidia",
    vramGb: 6, tbpW: 160, passmarkRaw: 14068, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/reviews/nvidia-geforce-rtx-2060-ray-tracing-turing,5960.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1080-Ti-Desktop.199810.0.html
  {
    id: "G18", kind: "legacy", name: "NVIDIA GTX 1080 Ti", vendor: "nvidia",
    vramGb: 11, tbpW: 250, passmarkRaw: 18597, passmarkSource: "PassMark", sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1080-Ti-Desktop.199810.0.html",
  },
  // Source: https://www.notebookcheck.net/KFA2-GeForce-GTX-1660-SUPER-Desktop-GPU-Review-The-GTX-16-series-also-receives-a-SUPER-upgrade.445034.0.html
  {
    id: "G19", kind: "legacy", name: "NVIDIA GTX 1660 Super", vendor: "nvidia",
    vramGb: 6, tbpW: 125, passmarkRaw: 12654, passmarkSource: "PassMark", sourceUrl: "https://www.notebookcheck.net/KFA2-GeForce-GTX-1660-SUPER-Desktop-GPU-Review-The-GTX-16-series-also-receives-a-SUPER-upgrade.445034.0.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1650-Desktop-GPU-Benchmarks-and-Specs.421420.0.html
  {
    id: "G20", kind: "legacy", name: "NVIDIA GTX 1650", vendor: "nvidia",
    vramGb: 4, tbpW: 75, passmarkRaw: 7861, passmarkSource: "PassMark", sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1650-Desktop-GPU-Benchmarks-and-Specs.421420.0.html",
  },
  // Source: https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-gtx-1060/
  {
    id: "G21", kind: "legacy", name: "NVIDIA GTX 1060", vendor: "nvidia",
    vramGb: 6, tbpW: 120, passmarkRaw: 10010, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-gtx-1060/",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html
  {
    id: "G22", kind: "legacy", name: "AMD RX 7900 XTX", vendor: "amd",
    vramGb: 24, tbpW: 355, passmarkRaw: 31470, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xt.html
  {
    id: "G23", kind: "legacy", name: "AMD RX 7900 XT", vendor: "amd",
    vramGb: 20, tbpW: 315, passmarkRaw: 29130, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html
  {
    id: "G24", kind: "legacy", name: "AMD RX 7800 XT", vendor: "amd",
    vramGb: 16, tbpW: 263, passmarkRaw: 24480, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7700-xt.html
  {
    id: "G25", kind: "legacy", name: "AMD RX 7700 XT", vendor: "amd",
    vramGb: 12, tbpW: 245, passmarkRaw: 22790, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7700-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6900-xt.html
  {
    id: "G27", kind: "legacy", name: "AMD RX 6900 XT", vendor: "amd",
    vramGb: 16, tbpW: 300, passmarkRaw: 26630, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6900-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800-xt.html
  {
    id: "G28", kind: "legacy", name: "AMD RX 6800 XT", vendor: "amd",
    vramGb: 16, tbpW: 300, passmarkRaw: 25121, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6700-xt.html
  {
    id: "G29", kind: "legacy", name: "AMD RX 6700 XT", vendor: "amd",
    vramGb: 12, tbpW: 230, passmarkRaw: 19715, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6700-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600-xt.html
  {
    id: "G30", kind: "legacy", name: "AMD RX 6600 XT", vendor: "amd",
    vramGb: 8, tbpW: 160, passmarkRaw: 16450, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600.html
  {
    id: "G31", kind: "legacy", name: "AMD RX 6600", vendor: "amd",
    vramGb: 8, tbpW: 132, passmarkRaw: 15030, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600.html",
  },
  // Source: https://thinkcomputers.org/amd-radeon-rx-5700-xt-and-rx-5700-official-specifications/
  {
    id: "G32", kind: "legacy", name: "AMD RX 5700 XT", vendor: "amd",
    vramGb: 8, tbpW: 225, passmarkRaw: 16020, passmarkSource: "PassMark", sourceUrl: "https://thinkcomputers.org/amd-radeon-rx-5700-xt-and-rx-5700-official-specifications/",
  },
  // Source: https://www.tomshardware.com/reviews/amd-radeon-rx-580-graphics-card-prices,5253.html
  {
    id: "G33", kind: "legacy", name: "AMD RX 580", vendor: "amd",
    vramGb: 8, tbpW: 185, passmarkRaw: 8781, passmarkSource: "PassMark", sourceUrl: "https://www.tomshardware.com/reviews/amd-radeon-rx-580-graphics-card-prices,5253.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-RTX-4080-GPU-Benchmarks-and-Specs.674575.0.html
  {
    id: "G34", kind: "legacy", name: "NVIDIA RTX 4080", vendor: "nvidia",
    vramGb: 16, tbpW: 320, passmarkRaw: 34445, passmarkSource: "PassMark", sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-RTX-4080-GPU-Benchmarks-and-Specs.674575.0.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-RTX-4070-Ti-GPU-Benchmarks-and-Specs.679267.0.html
  {
    id: "G35", kind: "legacy", name: "NVIDIA RTX 4070 Ti", vendor: "nvidia",
    vramGb: 12, tbpW: 285, passmarkRaw: 31510, passmarkSource: "PassMark", sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-RTX-4070-Ti-GPU-Benchmarks-and-Specs.679267.0.html",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/
  {
    id: "G36", kind: "legacy", name: "NVIDIA RTX 4060 Ti 16GB", vendor: "nvidia",
    vramGb: 16, tbpW: 165, passmarkRaw: 22522, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/
  {
    id: "G37", kind: "legacy", name: "NVIDIA RTX 3080 Ti", vendor: "nvidia",
    vramGb: 12, tbpW: 350, passmarkRaw: 26720, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/
  {
    id: "G38", kind: "legacy", name: "NVIDIA RTX 3080 12GB", vendor: "nvidia",
    vramGb: 12, tbpW: 350, passmarkRaw: 26553, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/
  {
    id: "G39", kind: "legacy", name: "NVIDIA RTX 3060 8GB", vendor: "nvidia",
    vramGb: 8, tbpW: 170, passmarkRaw: 15238, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/16-series/
  {
    id: "G41", kind: "legacy", name: "NVIDIA GTX 1660 Ti", vendor: "nvidia",
    vramGb: 6, tbpW: 120, passmarkRaw: 12539, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/16-series/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/16-series/
  {
    id: "G42", kind: "legacy", name: "NVIDIA GTX 1660", vendor: "nvidia",
    vramGb: 6, tbpW: 120, passmarkRaw: 11612, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/16-series/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/gtx-1650/
  {
    id: "G43", kind: "legacy", name: "NVIDIA GTX 1650 Super", vendor: "nvidia",
    vramGb: 4, tbpW: 100, passmarkRaw: 10188, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/gtx-1650/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1050/
  {
    id: "G44", kind: "legacy", name: "NVIDIA GTX 1050 Ti", vendor: "nvidia",
    vramGb: 4, tbpW: 75, passmarkRaw: 6369, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1050/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1070/
  {
    id: "G45", kind: "legacy", name: "NVIDIA GTX 1070", vendor: "nvidia",
    vramGb: 8, tbpW: 150, passmarkRaw: 13510, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1070/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1080/
  {
    id: "G46", kind: "legacy", name: "NVIDIA GTX 1080", vendor: "nvidia",
    vramGb: 8, tbpW: 180, passmarkRaw: 15608, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1080/",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900-gre.html
  {
    id: "G47", kind: "legacy", name: "AMD RX 7900 GRE", vendor: "amd",
    vramGb: 16, tbpW: 260, passmarkRaw: 27456, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900-gre.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600-xt.html
  {
    id: "G48", kind: "legacy", name: "AMD RX 7600 XT", vendor: "amd",
    vramGb: 16, tbpW: 190, passmarkRaw: 17413, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800.html
  {
    id: "G49", kind: "legacy", name: "AMD RX 6800", vendor: "amd",
    vramGb: 16, tbpW: 250, passmarkRaw: 22045, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6750-xt.html
  {
    id: "G50", kind: "legacy", name: "AMD RX 6750 XT", vendor: "amd",
    vramGb: 12, tbpW: 250, passmarkRaw: 20707, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6750-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6650-xt.html
  {
    id: "G51", kind: "legacy", name: "AMD RX 6650 XT", vendor: "amd",
    vramGb: 8, tbpW: 176, passmarkRaw: 17087, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6650-xt.html",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+470%2F570&id=3558
  {
    id: "G52", kind: "legacy", name: "AMD RX 570", vendor: "amd",
    vramGb: 4, tbpW: 150, passmarkRaw: 7903, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+470%2F570&id=3558",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/
  {
    id: "G53", kind: "legacy", name: "NVIDIA RTX 3090 Ti", vendor: "nvidia",
    vramGb: 24, tbpW: 450, passmarkRaw: 29176, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2080+SUPER&id=4123
  {
    id: "G54", kind: "legacy", name: "NVIDIA RTX 2080 Super", vendor: "nvidia",
    vramGb: 8, tbpW: 250, passmarkRaw: 19387, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2080+SUPER&id=4123",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2080&id=3989
  {
    id: "G55", kind: "legacy", name: "NVIDIA RTX 2080", vendor: "nvidia",
    vramGb: 8, tbpW: 215, passmarkRaw: 18561, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2080&id=3989",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2070&id=4001
  {
    id: "G56", kind: "legacy", name: "NVIDIA RTX 2070", vendor: "nvidia",
    vramGb: 8, tbpW: 175, passmarkRaw: 16057, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2070&id=4001",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2060+SUPER&id=4117
  {
    id: "G57", kind: "legacy", name: "NVIDIA RTX 2060 Super", vendor: "nvidia",
    vramGb: 8, tbpW: 175, passmarkRaw: 16448, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+RTX+2060+SUPER&id=4117",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+1070+Ti&id=3842
  {
    id: "G58", kind: "legacy", name: "NVIDIA GTX 1070 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 180, passmarkRaw: 14679, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+1070+Ti&id=3842",
  },
  // Source: https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-gtx-1060/
  {
    id: "G59", kind: "legacy", name: "NVIDIA GTX 1060 3GB", vendor: "nvidia",
    vramGb: 3, tbpW: 120, passmarkRaw: 9858, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-gtx-1060/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1050/
  {
    id: "G60", kind: "legacy", name: "NVIDIA GTX 1050", vendor: "nvidia",
    vramGb: 2, tbpW: 75, passmarkRaw: 5057, passmarkSource: "PassMark", sourceUrl: "https://www.nvidia.com/en-us/geforce/products/10series/geforce-gtx-1050/",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GT+1030&id=3757
  {
    id: "G61", kind: "legacy", name: "NVIDIA GT 1030", vendor: "nvidia",
    vramGb: 2, tbpW: 30, passmarkRaw: 2394, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GT+1030&id=3757",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6950-xt.html
  {
    id: "G62", kind: "legacy", name: "AMD RX 6950 XT", vendor: "amd",
    vramGb: 16, tbpW: 335, passmarkRaw: 28083, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6950-xt.html",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+6700&id=4564
  {
    id: "G63", kind: "legacy", name: "AMD RX 6700", vendor: "amd",
    vramGb: 10, tbpW: 175, passmarkRaw: 18839, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+6700&id=4564",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6400.html
  {
    id: "G65", kind: "legacy", name: "AMD RX 6400", vendor: "amd",
    vramGb: 4, tbpW: 53, passmarkRaw: 7756, passmarkSource: "PassMark", sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6400.html",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+5700&id=4107
  {
    id: "G66", kind: "legacy", name: "AMD RX 5700", vendor: "amd",
    vramGb: 8, tbpW: 180, passmarkRaw: 14187, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+5700&id=4107",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+5600+XT&id=4186
  {
    id: "G67", kind: "legacy", name: "AMD RX 5600 XT", vendor: "amd",
    vramGb: 6, tbpW: 150, passmarkRaw: 13374, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+5600+XT&id=4186",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+5500+XT&id=4174
  {
    id: "G68", kind: "legacy", name: "AMD RX 5500 XT", vendor: "amd",
    vramGb: 8, tbpW: 130, passmarkRaw: 9038, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+5500+XT&id=4174",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+590&id=4025
  {
    id: "G69", kind: "legacy", name: "AMD RX 590", vendor: "amd",
    vramGb: 8, tbpW: 175, passmarkRaw: 9272, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+590&id=4025",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+480&id=3533
  {
    id: "G70", kind: "legacy", name: "AMD RX 480", vendor: "amd",
    vramGb: 8, tbpW: 150, passmarkRaw: 8525, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+480&id=3533",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+470%2F570&id=3558
  {
    id: "G71", kind: "legacy", name: "AMD RX 470", vendor: "amd",
    vramGb: 4, tbpW: 120, passmarkRaw: 7903, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+470%2F570&id=3558",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+980+Ti&id=3218
  {
    id: "G72", kind: "legacy", name: "NVIDIA GTX 980 Ti", vendor: "nvidia",
    vramGb: 6, tbpW: 250, passmarkRaw: 13601, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+980+Ti&id=3218",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+970&id=2954
  {
    id: "G73", kind: "legacy", name: "NVIDIA GTX 970", vendor: "nvidia",
    vramGb: 4, tbpW: 145, passmarkRaw: 9635, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+970&id=2954",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+960&id=3114
  {
    id: "G74", kind: "legacy", name: "NVIDIA GTX 960", vendor: "nvidia",
    vramGb: 2, tbpW: 120, passmarkRaw: 6151, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+960&id=3114",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+750+Ti&id=2815
  {
    id: "G75", kind: "legacy", name: "NVIDIA GTX 750 Ti", vendor: "nvidia",
    vramGb: 2, tbpW: 60, passmarkRaw: 3900, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=GeForce+GTX+750+Ti&id=2815",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+Vega+64&id=3808
  {
    id: "G76", kind: "legacy", name: "AMD RX Vega 64", vendor: "amd",
    vramGb: 8, tbpW: 295, passmarkRaw: 13828, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+Vega+64&id=3808",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+Vega+56&id=3821
  {
    id: "G77", kind: "legacy", name: "AMD RX Vega 56", vendor: "amd",
    vramGb: 8, tbpW: 210, passmarkRaw: 12913, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+RX+Vega+56&id=3821",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A770&id=4605
  {
    id: "G78", kind: "legacy", name: "Intel Arc A770", vendor: "intel",
    vramGb: 16, tbpW: 225, passmarkRaw: 13384, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A770&id=4605",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A750&id=4612
  {
    id: "G79", kind: "legacy", name: "Intel Arc A750", vendor: "intel",
    vramGb: 8, tbpW: 225, passmarkRaw: 12617, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A750&id=4612",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A580&id=4940
  {
    id: "G80", kind: "legacy", name: "Intel Arc A580", vendor: "intel",
    vramGb: 8, tbpW: 185, passmarkRaw: 12060, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A580&id=4940",
  },
  // Source: https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A380&id=4568
  {
    id: "G81", kind: "legacy", name: "Intel Arc A380", vendor: "intel",
    vramGb: 6, tbpW: 75, passmarkRaw: 6340, passmarkSource: "PassMark", sourceUrl: "https://www.videocardbenchmark.net/gpu.php?gpu=Intel+Arc+A380&id=4568",
  },
];
