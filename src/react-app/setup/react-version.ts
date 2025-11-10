import * as React from "react";
import { version as exportedVersion } from "react";

type DevToolsRenderer = { version?: string | null };
type DevToolsHook = {
  renderers?: Map<unknown, DevToolsRenderer>;
  registerRenderer?: (id: number, renderer: DevToolsRenderer) => unknown;
  __cityblocksVersionPatched__?: boolean;
};

const FALLBACK_VERSION = "19.2.0";
const normalized =
  typeof exportedVersion === "string" && exportedVersion.trim().length > 0
    ? exportedVersion
    : FALLBACK_VERSION;

const patchReactVersion = () => {
  const needsPatch =
    typeof (React as Record<string, unknown>).version !== "string" ||
    !((React as Record<string, unknown>).version as string).trim();

  if (!needsPatch) return;

  try {
    Object.defineProperty(React, "version", {
      configurable: false,
      enumerable: true,
      writable: false,
      value: normalized,
    });
  } catch (error) {
    console.warn("React version patch failed:", error);
  }
};

const patchRendererMetadata = (renderer?: DevToolsRenderer) => {
  if (!renderer) return;
  if (!renderer.version || !String(renderer.version).trim()) {
    renderer.version = normalized;
  }
};

const patchHook = (hook?: DevToolsHook) => {
  if (!hook || hook.__cityblocksVersionPatched__) return;
  hook.__cityblocksVersionPatched__ = true;

  const { renderers, registerRenderer } = hook;

  if (renderers && typeof renderers.forEach === "function") {
    try {
      renderers.forEach(patchRendererMetadata);
    } catch {
      // ignore iteration issues (older DevTools versions)
    }

    const originalSet = renderers.set;
    if (typeof originalSet === "function") {
      renderers.set = function patchedSet(id: unknown, renderer: DevToolsRenderer) {
        patchRendererMetadata(renderer);
        return originalSet.call(this, id, renderer);
      };
    }
  }

  if (typeof registerRenderer === "function") {
    hook.registerRenderer = function patchedRegister(id: number, renderer: DevToolsRenderer) {
      patchRendererMetadata(renderer);
      return registerRenderer.call(this, id, renderer);
    };
  }
};

const installHookInterceptor = () => {
  const key = "__REACT_DEVTOOLS_GLOBAL_HOOK__";
  const globalObj = globalThis as typeof globalThis & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: DevToolsHook;
  };

  if (globalObj[key]) {
    patchHook(globalObj[key]);
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(globalObj, key);
  if (descriptor && !descriptor.configurable) return;

  let storedHook: DevToolsHook | undefined;
  Object.defineProperty(globalObj, key, {
    configurable: true,
    get() {
      return storedHook;
    },
    set(value) {
      storedHook = value;
      patchHook(storedHook);
    },
  });
};

patchReactVersion();
installHookInterceptor();
