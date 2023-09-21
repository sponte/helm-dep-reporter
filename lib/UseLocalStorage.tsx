'use client';

import { useState, useEffect } from "react";

const save = (key: string, value: any) => localStorage && localStorage.setItem(key, JSON.stringify(value));

const useLocalStorage = (key: string, defaultValue: any) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;

    let currentValue;

    if (localStorage && localStorage.getItem(key) === null) {
      currentValue = defaultValue;
      save(key, defaultValue)
    } else {
      currentValue = JSON.parse(localStorage && localStorage.getItem(key)!)
    }

    return currentValue;
  });

  useEffect(() => {
    save(key, value);
  }, [value, key]);

  return [value, setValue];
};

export default useLocalStorage;