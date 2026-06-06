'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import type { GeoGebraPayload } from '@talim/types';

const GGB_SCRIPT = 'https://www.geogebra.org/apps/deployggb.js';

declare global {
  interface Window {
    GGBApplet?: new (
      params: Record<string, unknown>,
      isHTML5?: boolean,
    ) => { inject: (id: string) => void };
  }
}

export function GeoGebraEmbed({ payload }: { payload: GeoGebraPayload }) {
  const t = useTranslations('chat');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerId = useRef(`ggb-${Math.random().toString(36).slice(2)}`).current;
  const [scriptReady, setScriptReady] = useState(
    typeof window !== 'undefined' && Boolean(window.GGBApplet),
  );
  const [containerWidth, setContainerWidth] = useState(480);
  const [error, setError] = useState(false);
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.GGBApplet) return;

    try {
      const commands = payload.commands;
      const defaultWidth = payload.width ?? 480;
      const defaultHeight = payload.height ?? 320;
      const width = Math.min(defaultWidth, Math.max(containerWidth, 1));
      const height = Math.round(defaultHeight * (width / defaultWidth));
      const applet = new window.GGBApplet(
        {
          appName: payload.appName,
          width,
          height,
          showToolBar: payload.showToolBar ?? false,
          showAlgebraInput: false,
          showMenuBar: false,
          enableRightClick: false,
          enableShiftDragZoom: true,
          showZoomButtons: true,
          errorDialogsActive: false,
          appletOnLoad: (api: { evalCommand: (cmd: string) => void }) => {
            for (const cmd of commands) {
              api.evalCommand(cmd);
            }
          },
        },
        true,
      );
      applet.inject(containerId);
      setError(false);
    } catch {
      setError(true);
    }
  }, [scriptReady, payloadKey, containerId, payload, containerWidth]);

  return (
    <div ref={wrapperRef} className="relative my-2 max-w-full overflow-x-auto">
      {!scriptReady && (
        <Script
          src={GGB_SCRIPT}
          strategy="lazyOnload"
          onLoad={() => setScriptReady(true)}
          onError={() => setError(true)}
        />
      )}
      {error ? (
        <p className="rounded-md border bg-muted p-3 text-xs text-muted-foreground">{t('geogebraError')}</p>
      ) : (
        <div
          id={containerId}
          className="overflow-hidden rounded-md border bg-card"
          aria-label={t('geogebraLabel')}
        />
      )}
    </div>
  );
}
