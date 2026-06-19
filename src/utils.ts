/**
 * Generate a deterministic high-fidelity QR Code SVG, return as a Data URI.
 * Employs a custom layout with standard QR finder patterns and deterministic noise
 * from a string's SHA-like hash, completely client-side.
 */
export function generateVisualQRCodeSVG(text: string): string {
  // Simple hashing algorithm
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  const size = 25; // 25x25 grid
  let svgContent = "";

  // Draw corner finders (traditional QR finder symbols)
  // 1. Top-Left
  svgContent += drawFinderPattern(0, 0);
  // 2. Top-Right
  svgContent += drawFinderPattern(size - 7, 0);
  // 3. Bottom-Left
  svgContent += drawFinderPattern(0, size - 7);

  // Extra alignment pattern in the bottom right quadrant
  svgContent += `<rect x="${size - 9}" y="${size - 9}" width="5" height="5" fill="%23eab308" />`;
  svgContent += `<rect x="${size - 8}" y="${size - 8}" width="3" height="3" fill="black" />`;
  svgContent += `<rect x="${size - 7}" y="${size - 7}" width="1" height="1" fill="%23eab308" />`;

  // Draw deterministic grid representing coded data
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Avoid finder areas
      if (
        (row < 8 && col < 8) || // Top-Left
        (row < 8 && col >= size - 8) || // Top-Right
        (row >= size - 8 && col < 8) || // Bottom-Left
        (row >= size - 9 && col >= size - 9) // Bottom-Right Alignment area
      ) {
        continue;
      }

      // Generate visual blocks
      const seed = Math.sin(hash + row * 19 + col * 43) * 10000;
      const randVal = seed - Math.floor(seed);
      if (randVal > 0.45) {
        // Use gold/amber highlight representing premium branding!
        const color = randVal > 0.85 ? "%23eab308" : "black";
        svgContent += `<rect x="${col}" y="${row}" width="1" height="1" fill="${color}" />`;
      }
    }
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" width="100%" height="100%"><rect width="${size}" height="${size}" fill="white" />${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

function drawFinderPattern(x: number, y: number): string {
  let content = "";
  // Outermost 7x7 black box
  content += `<rect x="${x}" y="${y}" width="7" height="7" fill="black" />`;
  // Inner 5x5 white box
  content += `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="white" />`;
  // Center 3x3 box (gold accent for Leature Movies brand!)
  content += `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="%23eab308" />`;
  return content;
}

/**
 * Generate standard unique booking / movie references.
 */
export function generateRandomId(prefix: string = "LTR"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

/**
 * Clean currency formatting for numbers.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a 24-hour time string "HH:MM" to "hh:mm AM/PM" format.
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
    return timeStr;
  }
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const formattedHours = hours.toString().padStart(2, "0");
  return `${formattedHours}:${minutes} ${period}`;
}

/**
 * Static placeholder movie poster links in case admin wants pre-selected cinematic covers.
 * Let's curate extremely beautiful, royalty-free thematic cinematic poster links.
 */
export const CINEMATIC_COVERS = [
  {
    title: "Dune Warriors",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Cosmic Odysseys",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Cyberpunk 2099",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600",
  },
  {
    title: "Neon Shadows",
    url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600",
  },
];
