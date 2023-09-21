'use client';
export function Log(component: Function) {
  return (...args: any) => {
    console.log('[%s] ' + args[0], ...[component.name].concat(...args.slice(1)));
  };
}
