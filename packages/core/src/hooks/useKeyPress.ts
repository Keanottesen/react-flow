import { useState, useEffect, useRef, useMemo } from 'react';

import { isInputDOMNode } from '../utils';
import type { KeyCode } from '../types';

type Keys = Array<string>;
type PressedKeys = Set<string>;
type KeyOrCode = 'key' | 'code';
export interface UseKeyPressOptions {
  target?: Window | Document | HTMLElement | ShadowRoot | null;
  // we want to distinguish between actions that are doable within an input (like multiselection) and actions that are not (like deleting a node) while pressing a modifier key
  actInsideInputWithModifier?: boolean;
}

// the keycode can be a string 'a' or an array of strings ['a', 'a+d']
// a string means a single key 'a' or a combination when '+' is used 'a+d'
// an array means different possibilities. Explainer: ['a', 'd+s'] here the
// user can use the single key 'a' or the combination 'd' + 's'
export default (
  keyCode: KeyCode | null = null,
  options: UseKeyPressOptions = { actInsideInputWithModifier: true }
): boolean => {
  const [keyPressed, setKeyPressed] = useState(false);

  // we need to remember if a modifier key is pressed in order to track it
  const modifierPressed = useRef(false);

  // we need to remember the pressed keys in order to support combinations
  const pressedKeys = useRef<PressedKeys>(new Set([]));

  // keyCodes = array with single keys [['a']] or key combinations [['a', 's']]
  // keysToWatch = array with all keys flattened ['a', 'd', 'ShiftLeft']
  // used to check if we store event.code or event.key. When the code is in the list of keysToWatch
  // we use the code otherwise the key. Explainer: When you press the left "command" key, the code is "MetaLeft"
  // and the key is "Meta". We want users to be able to pass keys and codes so we assume that the key is meant when
  // we can't find it in the list of keysToWatch.
  const [keyCodes, keysToWatch] = useMemo<[Array<Keys>, Keys]>(() => {
    if (keyCode !== null) {
      const keyCodeArr = Array.isArray(keyCode) ? keyCode : [keyCode];
      const keys = keyCodeArr.filter((kc) => typeof kc === 'string').map((kc) => kc.split('+'));
      const keysFlat = keys.reduce((res: Keys, item) => res.concat(...item), []);

      return [keys, keysFlat];
    }

    return [[], []];
  }, [keyCode]);

  useEffect(() => {
    const doc = typeof document !== 'undefined' ? document : null;
    const target = options?.target || doc;

    if (keyCode !== null) {
      const downHandler = (event: KeyboardEvent) => {
        modifierPressed.current = event.ctrlKey || event.metaKey || event.shiftKey;
        const preventAction =
          (!modifierPressed.current || (modifierPressed.current && !options.actInsideInputWithModifier)) &&
          isInputDOMNode(event);

        if (preventAction) {
          return false;
        }

        const keyOrCode = useKeyOrCode(event.code, keysToWatch);
        pressedKeys.current.add(event[keyOrCode]);

        if (isMatchingKey(keyCodes, pressedKeys.current, false)) {
          event.preventDefault();
          setKeyPressed(true);
        }
      };

      const upHandler = (event: KeyboardEvent) => {
        const preventAction =
          (!modifierPressed.current || (modifierPressed.current && !options.actInsideInputWithModifier)) &&
          isInputDOMNode(event);
        if (preventAction) {
          return false;
        }
        const keyOrCode = useKeyOrCode(event.code, keysToWatch);

        if (isMatchingKey(keyCodes, pressedKeys.current, true)) {
          setKeyPressed(false);
          pressedKeys.current.clear();
        } else {
          pressedKeys.current.delete(event[keyOrCode]);
        }

        // fix for Mac: when cmd key is pressed, keyup is not triggered for any other key, see: https://stackoverflow.com/questions/27380018/when-cmd-key-is-kept-pressed-keyup-is-not-triggered-for-any-other-key
        if (event.key === 'Meta') {
          pressedKeys.current.clear();
        }

        modifierPressed.current = false;
      };

      const resetHandler = () => {
        pressedKeys.current.clear();
        setKeyPressed(false);
      };

      target?.addEventListener('keydown', downHandler as EventListenerOrEventListenerObject);
      target?.addEventListener('keyup', upHandler as EventListenerOrEventListenerObject);
      window.addEventListener('blur', resetHandler);

      return () => {
        target?.removeEventListener('keydown', downHandler as EventListenerOrEventListenerObject);
        target?.removeEventListener('keyup', upHandler as EventListenerOrEventListenerObject);
        window.removeEventListener('blur', resetHandler);
      };
    }
  }, [keyCode, setKeyPressed]);

  return keyPressed;
};

// utils

function isMatchingKey(keyCodes: Array<Keys>, pressedKeys: PressedKeys, isUp: boolean): boolean {
  return (
    keyCodes
      // we only want to compare same sizes of keyCode definitions
      // and pressed keys. When the user specified 'Meta' as a key somewhere
      // this would also be truthy without this filter when user presses 'Meta' + 'r'
      .filter((keys) => isUp || keys.length === pressedKeys.size)
      // since we want to support multiple possibilities only one of the
      // combinations need to be part of the pressed keys
      .some((keys) => keys.every((k) => pressedKeys.has(k)))
  );
}

function useKeyOrCode(eventCode: string, keysToWatch: KeyCode): KeyOrCode {
  return keysToWatch.includes(eventCode) ? 'code' : 'key';
}
