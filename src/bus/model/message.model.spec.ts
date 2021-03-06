/*
 * Copyright 2017-2018 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Message} from './message.model';
import { MessageType } from '../../bus.api';

describe('Stream Model [stream]', () => {

    let message: Message;

    let testError = {
        error: 'fake error'
    };

    let testData = {
        data: 'fake data'
    };

    beforeEach(function () {
        message = new Message();
    });

    it('Should check instantiation and getters/setters',
        () => {
            expect(message.isError())
                .toBeFalsy();
            expect(message.payload)
                .toBeUndefined();
            message.request(testData);
            expect(message.payload.data)
                .toBe('fake data');
            expect(message.isRequest())
                .toBeTruthy();
            expect(message.isResponse())
                .toBeFalsy();
            expect(message.isError())
                .toBeFalsy();
            expect(message.type)
                .toBe(MessageType.MessageTypeRequest);
            message.payload = undefined;
            expect(message.payload)
                .toBeUndefined();
            message.response(testData);
            expect(message.payload.data)
                .toBe('fake data');
            message.error(testError);
            expect(message.isError)
                .toBeTruthy();
            expect(message.payload.error)
                .toBe('fake error');
        }
    );

});

