import React, { useState, useMemo, useRef } from 'react';
/**
 * 一般用于input组件, 入参 value(受控) , defaultValue(不受控) 与组件内部 使用 value 的协调
 * @param value (受控)
 * @param defaultValue (不受控)
 *
 * 一般还需要结合 props.onChange 方法, 同步 value(受控)
 * const [v,setV] = useBindValue<string>(props.value, props.defaultValue)
 * const asyncValue = (value:string)=>{
 *    setV(value);
 *    props.onChange(value)
 * }
 */
function useBindValue<T>(
  value: T | undefined,
  defaultValue: T | undefined
): [T | undefined, React.Dispatch<React.SetStateAction<T>>];
/**
 *
 * @param value (受控)
 * @param defaultValue (不受控)
 * @param defaultV 默认值
 */
function useBindValue<T>(
  value: T | undefined,
  defaultValue: T | undefined,
  defaultV: T
): [T, React.Dispatch<React.SetStateAction<T>>];
/**
 *
 * @param value (受控)
 * @param defaultValue (不受控)
 * @param defaultV 默认值
 * @returns 反回入理过的 value 与 setValue
 */
function useBindValue<T>(
  value: T | undefined,
  defaultValue: T | undefined,
  defaultV?: T
): [T | undefined, React.Dispatch<React.SetStateAction<T>>] {
  const inputValue = value !== undefined;
  const inputDefaultValue = defaultValue !== undefined;
  const [_value, _setValue] = useState<T | undefined>(inputValue ? value : inputDefaultValue ? defaultValue : defaultV);
  const that = useRef({
    value: _value,
    setValue: (s: T | ((v: T) => T)) => {
      let nextValue: T;
      if (typeof s === 'function') {
        nextValue = (s as (v: T) => T)(that.current.value as T);
      } else {
        nextValue = s;
      }
      that.current.value = nextValue;
      _setValue(nextValue);
    },
  });
  const status = useMemo<T | undefined>(() => {
    const inputValue = value !== undefined;
    const status = inputValue ? value : _value;
    that.current.value = status;
    return status;
  }, [value, _value]);
  return [status, that.current.setValue];
}

export { useBindValue };
