'use client';

import type { VisualBlock } from '@talim/types';
import { DesmosGraph } from './DesmosGraph';
import { MermaidDiagram } from './MermaidDiagram';
import { TutorChart } from './TutorChart';
import { GeoGebraEmbed } from './GeoGebraEmbed';
import { ManimVideo } from './ManimVideo';
import { HtmlSandbox } from './HtmlSandbox';

export function VisualBlockRenderer({ block }: { block: VisualBlock }) {
  switch (block.kind) {
    case 'desmos':
      return <DesmosGraph payload={block.payload} />;
    case 'mermaid':
      return <MermaidDiagram payload={block.payload} />;
    case 'chart':
      return <TutorChart payload={block.payload} />;
    case 'geogebra':
      return <GeoGebraEmbed payload={block.payload} />;
    case 'manim':
      return <ManimVideo payload={block.payload} />;
    case 'html-sandbox':
      return <HtmlSandbox payload={block.payload} />;
    default:
      return null;
  }
}
