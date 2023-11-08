import React, { useState, useEffect } from "react";
import Events from "events";

type userObject<T = any> = {
  (v?: T): T;
  set(v: T): void;
  get(): T;
};

/**
 * 不受控转受控
 */
function getUseValue<T = any>(): userObject<T>;
function getUseValue<T = any>(defaultValue: T): userObject<T>;
function getUseValue<T>(get: () => T, set: (val: T) => void): userObject<T>;
function getUseValue<T>(
  get: () => T,
  set: (val: T) => void,
  defaultValue: T
): userObject<T>;
function getUseValue<T>(get?: any, set?: any, defaultValue?: any) {
  if (arguments.length < 2) {
    let _value: T = arguments[0];
    get = () => _value;
    set = (v: T) => {
      _value = v;
    };
  }
  const valueEvent = new Events();
  valueEvent.on("setValue", function (event: T) {
    set(event);
    valueEvent.emit("upValue", event);
  });
  if (defaultValue) {
    set(defaultValue);
  }
  const useValue = (_value?: T) => {
    const [value, setValue] = useState<T | undefined>(get ? get() : undefined);
    useEffect(() => {
      _value && valueEvent.emit("setValue", _value);
      valueEvent.on("upValue", setValue);
      return () => {
        valueEvent.off("upValue", setValue);
      };
    }, []);
    return value;
  };
  useValue.set = (v: T) => {
    valueEvent.emit("setValue", v);
  };
  useValue.get = () => {
    return get?.();
  };
  return useValue;
}

export default getUseValue;
