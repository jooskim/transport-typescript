/*
 * Copyright 2018 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

// https://medium.com/@dmyl/mixins-as-class-decorators-in-typescript-angular2-8e09f1bc1f02
export function Mixin(baseCtors: Function[]) {
    return function (derivedCtor: Function) {
        baseCtors.forEach(baseCtor => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
                const descriptor = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);

                if (name === 'constructor') {
                    return;
                }

                if (descriptor && (!descriptor.writable || !descriptor.configurable
                    || !descriptor.enumerable || descriptor.get || descriptor.set)) {
                    Object.defineProperty(derivedCtor.prototype, name, descriptor);
                } else {
                    derivedCtor.prototype[name] = baseCtor.prototype[name];
                }

            });
        });
    };
}
