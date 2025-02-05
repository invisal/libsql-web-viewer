interface ChartLayer {
  sql: string;
  type: string;
}

export type ChartLegend = "none" | "top" | "bottom" | "left" | "right";
export type ChartLabelDisplayX = "auto" | "0" | "45" | "90" | "hidden";
export type ChartLabelDisplayY = "left" | "right" | "hidden";
export type ChartSortOrder = "default" | "asc" | "desc";
export type SingleValueFormat =
  | "percent"
  | "number"
  | "decimal"
  | "date"
  | "time"
  | "dollar"
  | "euro"
  | "pound"
  | "yen";

interface ChartOptions {
  foreground?: string;
  gradientStop?: string;
  gradientStart?: string;
  backgroundType?: string;
  xAxisLabelHidden?: boolean;
  yAxisLabelHidden?: boolean;
  legend?: ChartLegend;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisKey: string;
  yAxisKeys: string[];
  yAxisKeyColors?: Record<string, string>;
  xAxisLabelDisplay?: ChartLabelDisplayX;
  yAxisLabelDisplay?: ChartLabelDisplayY;
  sortOrder?: ChartSortOrder;
  groupBy?: string;
  percentage?: boolean;
  text?: string;
  format?: SingleValueFormat;
  theme?: string;
}

interface ChartParams {
  id: string;
  name: string;
  type: ChartType;
  model: string;
  apiKey: string;
  layers: ChartLayer[];
  options: ChartOptions;
  source_id: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  connection_id: string | null;
}

export interface ChartValue {
  connection_id: string | null;
  created_at: string;
  id: string;
  model: string;
  name: string;
  params: ChartParams;
  source_id: string;
  type: ChartType;
  updated_at: string;
  workspace_id: string;
  description?: string;
}

export interface ChartData {
  [key: string]: any;
}

export type ChartType =
  | "line"
  | "bar"
  | "pie"
  | "radar"
  | "funnel"
  | "area"
  | "column"
  | "scatter"
  | "text"
  | "table"
  | "single_value";

export type ThemeColors =
  | "neonPunk"
  | "cyberGlow"
  | "neoTokyo"
  | "synthwave"
  | "vaporwave"
  | "iridium"
  | "celestial"
  | "cobalt"
  | "afterburn"
  | "mercury";

export const THEMES: Record<
  ThemeColors,
  { background: string; colors: { light: string[]; dark: string[] } }
> = {
  neonPunk: {
    background: "linear-gradient(145deg, #1e0338 0%, #4a0d67 100%)",
    colors: {
      light: ["#ff2e6e", "#8c54ff"],
      dark: ["#ff2e6e", "#8c54ff"],
    },
  },
  cyberGlow: {
    background: "linear-gradient(145deg, #16213e 0%, #1a1a2e 100%)",
    colors: {
      light: ["#ffa726", "#ff5722"],
      dark: ["#ffa726", "#ff5722"],
    },
  },
  neoTokyo: {
    background: "linear-gradient(145deg, #2d0a31 0%, #440a44 100%)",
    colors: {
      light: ["#ff71ce", "#01cdfe"],
      dark: ["#ff71ce", "#01cdfe"],
    },
  },
  synthwave: {
    background: "linear-gradient(145deg, #2b1055 0%, #7597de 100%)",
    colors: {
      light: ["#ff2a6d", "#05d9e8"],
      dark: ["#ff2a6d", "#05d9e8"],
    },
  },
  vaporwave: {
    background: "linear-gradient(145deg, #391f5e 0%, #6b3fa0 100%)",
    colors: {
      light: ["#ff71ce", "#b967ff"],
      dark: ["#ff71ce", "#b967ff"],
    },
  },
  iridium: {
    background: "linear-gradient(145deg, #0b4f3b 0%, #69b765 100%)",
    colors: {
      light: ["#87E9C0", "#B9D975", "#C9D69B"],
      dark: ["#87E9C0", "#B9D975", "#C9D69B"],
    },
  },
  celestial: {
    background: "linear-gradient(145deg, #004b6b 0%, #1de2ff 100%)",
    colors: {
      light: ["#D1FFFF", "#93FDFF", "#1A9EF5"],
      dark: ["#D1FFFF", "#93FDFF", "#1A9EF5"],
    },
  },
  cobalt: {
    background: "linear-gradient(145deg, #2b256e 0%, #6b82ff 100%)",
    colors: {
      light: ["#5956E2", "#A99AFF", "#82DBFF"],
      dark: ["#5956E2", "#A99AFF", "#82DBFF"],
    },
  },
  afterburn: {
    background: "linear-gradient(145deg, #731d39 0%, #e47096 100%)",
    colors: {
      light: ["#E75F98", "#FFA285", "#CCB8F2"],
      dark: ["#E75F98", "#FFA285", "#CCB8F2"],
    },
  },
  mercury: {
    background: "linear-gradient(145deg, #262626 0%, #a3a3a3 100%)",
    colors: {
      light: ["#0a0a0a", "#a3a3a3", "#525252", "#262626", "#e5e5e5"],
      dark: ["#fafafa", "#525252", "#a3a3a3", "#e5e5e5", "#262626"],
    },
  },
};
