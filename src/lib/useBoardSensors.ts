"use client";

import { MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

/** Touch: 500ms hold before drag. Mouse/pointer: 8px movement threshold. */
export function useBoardSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 8 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
}
