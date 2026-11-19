import 'server-only';

import type { LegacyGpuSeriesSeed } from '../types';

export const LEGACY_GPU_SERIES_SEEDS: readonly LegacyGpuSeriesSeed[] = [
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/
  {
    id: "G01", kind: "legacy", name: "NVIDIA RTX 4090", vendor: "nvidia",
    vramGb: 24, tbpW: 450, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/
  {
    id: "G02", kind: "legacy", name: "NVIDIA RTX 4080 Super", vendor: "nvidia",
    vramGb: 16, tbpW: 320, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/
  {
    id: "G03", kind: "legacy", name: "NVIDIA RTX 4070 Ti Super", vendor: "nvidia",
    vramGb: 16, tbpW: 285, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/
  {
    id: "G04", kind: "legacy", name: "NVIDIA RTX 4070 Super", vendor: "nvidia",
    vramGb: 12, tbpW: 220, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/
  {
    id: "G05", kind: "legacy", name: "NVIDIA RTX 4070", vendor: "nvidia",
    vramGb: 12, tbpW: 200, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/
  {
    id: "G06", kind: "legacy", name: "NVIDIA RTX 4060 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 160, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/
  {
    id: "G07", kind: "legacy", name: "NVIDIA RTX 4060", vendor: "nvidia",
    vramGb: 8, tbpW: 115, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/
  {
    id: "G08", kind: "legacy", name: "NVIDIA RTX 3090", vendor: "nvidia",
    vramGb: 24, tbpW: 350, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3090-3090ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/
  {
    id: "G09", kind: "legacy", name: "NVIDIA RTX 3080", vendor: "nvidia",
    vramGb: 10, tbpW: 320, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3080-3080ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/
  {
    id: "G10", kind: "legacy", name: "NVIDIA RTX 3070 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 290, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/
  {
    id: "G11", kind: "legacy", name: "NVIDIA RTX 3070", vendor: "nvidia",
    vramGb: 8, tbpW: 220, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3070-3070ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/
  {
    id: "G12", kind: "legacy", name: "NVIDIA RTX 3060 Ti", vendor: "nvidia",
    vramGb: 8, tbpW: 200, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/
  {
    id: "G13", kind: "legacy", name: "NVIDIA RTX 3060", vendor: "nvidia",
    vramGb: 12, tbpW: 170, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/",
  },
  // Source: https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3050/
  {
    id: "G14", kind: "legacy", name: "NVIDIA RTX 3050", vendor: "nvidia",
    vramGb: 8, tbpW: 130, sourceUrl: "https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3050/",
  },
  // Source: https://www.nvidia.com/content/nvidiaGDC/zz/en_ZZ/geforce/graphics-cards/rtx-2080-ti.html
  {
    id: "G15", kind: "legacy", name: "NVIDIA RTX 2080 Ti", vendor: "nvidia",
    vramGb: 11, tbpW: 250, sourceUrl: "https://www.nvidia.com/content/nvidiaGDC/zz/en_ZZ/geforce/graphics-cards/rtx-2080-ti.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-RTX-2070-Super-GPU-Benchmarks-and-Specs.426831.0.html
  {
    id: "G16", kind: "legacy", name: "NVIDIA RTX 2070 Super", vendor: "nvidia",
    vramGb: 8, tbpW: 215, sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-RTX-2070-Super-GPU-Benchmarks-and-Specs.426831.0.html",
  },
  // Source: https://www.tomshardware.com/reviews/nvidia-geforce-rtx-2060-ray-tracing-turing,5960.html
  {
    id: "G17", kind: "legacy", name: "NVIDIA RTX 2060", vendor: "nvidia",
    vramGb: 6, tbpW: 160, sourceUrl: "https://www.tomshardware.com/reviews/nvidia-geforce-rtx-2060-ray-tracing-turing,5960.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1080-Ti-Desktop.199810.0.html
  {
    id: "G18", kind: "legacy", name: "NVIDIA GTX 1080 Ti", vendor: "nvidia",
    vramGb: 11, tbpW: 250, sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1080-Ti-Desktop.199810.0.html",
  },
  // Source: https://www.notebookcheck.net/KFA2-GeForce-GTX-1660-SUPER-Desktop-GPU-Review-The-GTX-16-series-also-receives-a-SUPER-upgrade.445034.0.html
  {
    id: "G19", kind: "legacy", name: "NVIDIA GTX 1660 Super", vendor: "nvidia",
    vramGb: 6, tbpW: 125, sourceUrl: "https://www.notebookcheck.net/KFA2-GeForce-GTX-1660-SUPER-Desktop-GPU-Review-The-GTX-16-series-also-receives-a-SUPER-upgrade.445034.0.html",
  },
  // Source: https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1650-Desktop-GPU-Benchmarks-and-Specs.421420.0.html
  {
    id: "G20", kind: "legacy", name: "NVIDIA GTX 1650", vendor: "nvidia",
    vramGb: 4, tbpW: 75, sourceUrl: "https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1650-Desktop-GPU-Benchmarks-and-Specs.421420.0.html",
  },
  // Source: https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-gtx-1060/
  {
    id: "G21", kind: "legacy", name: "NVIDIA GTX 1060", vendor: "nvidia",
    vramGb: 6, tbpW: 120, sourceUrl: "https://www.nvidia.com/en-us/geforce/news/nvidia-geforce-gtx-1060/",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html
  {
    id: "G22", kind: "legacy", name: "AMD RX 7900 XTX", vendor: "amd",
    vramGb: 24, tbpW: 355, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xt.html
  {
    id: "G23", kind: "legacy", name: "AMD RX 7900 XT", vendor: "amd",
    vramGb: 20, tbpW: 315, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html
  {
    id: "G24", kind: "legacy", name: "AMD RX 7800 XT", vendor: "amd",
    vramGb: 16, tbpW: 263, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7700-xt.html
  {
    id: "G25", kind: "legacy", name: "AMD RX 7700 XT", vendor: "amd",
    vramGb: 12, tbpW: 245, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7700-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600.html
  {
    id: "G26", kind: "legacy", name: "AMD RX 7600", vendor: "amd",
    vramGb: 8, tbpW: 165, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6900-xt.html
  {
    id: "G27", kind: "legacy", name: "AMD RX 6900 XT", vendor: "amd",
    vramGb: 16, tbpW: 300, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6900-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800-xt.html
  {
    id: "G28", kind: "legacy", name: "AMD RX 6800 XT", vendor: "amd",
    vramGb: 16, tbpW: 300, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6800-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6700-xt.html
  {
    id: "G29", kind: "legacy", name: "AMD RX 6700 XT", vendor: "amd",
    vramGb: 12, tbpW: 230, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6700-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600-xt.html
  {
    id: "G30", kind: "legacy", name: "AMD RX 6600 XT", vendor: "amd",
    vramGb: 8, tbpW: 160, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600-xt.html",
  },
  // Source: https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600.html
  {
    id: "G31", kind: "legacy", name: "AMD RX 6600", vendor: "amd",
    vramGb: 8, tbpW: 132, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600.html",
  },
  // Source: https://thinkcomputers.org/amd-radeon-rx-5700-xt-and-rx-5700-official-specifications/
  {
    id: "G32", kind: "legacy", name: "AMD RX 5700 XT", vendor: "amd",
    vramGb: 8, tbpW: 225, sourceUrl: "https://thinkcomputers.org/amd-radeon-rx-5700-xt-and-rx-5700-official-specifications/",
  },
  // Source: https://www.tomshardware.com/reviews/amd-radeon-rx-580-graphics-card-prices,5253.html
  {
    id: "G33", kind: "legacy", name: "AMD RX 580", vendor: "amd",
    vramGb: 8, tbpW: 185, sourceUrl: "https://www.tomshardware.com/reviews/amd-radeon-rx-580-graphics-card-prices,5253.html",
  },
];
