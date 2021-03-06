/*
 * Copyright 2017-2019 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Subject, Subscription } from 'rxjs';
import { StompClient } from './stomp.client';
import { MockSocket } from './stomp.mocksocket';
import { UUID } from '../bus/store/store.model';
import { Logger } from '../log';
import { GeneralUtil } from '../util/util';
import { EventBus } from '../bus.api';
import { DEFAULT_ACCESS_TOKEN_KEY } from '../fabric/fabric';

export type TransportSocket = WebSocket;

export class BrokerConnectorChannel {

    static connection: string = 'transport-services::broker.connector-connection';
    static subscription: string = 'transport-services::broker.connector-subscription';
    static messages: string = 'transport-services::broker.connector-messages';
    static error: string = 'transport-services::broker.connector-error';
    static status: string = 'transport-services::broker.connector-status';

}
export interface StompMessage {
    command: string;
    headers: any;
    body: string;
    toString(): string;
}
export interface StompBusCommand {
    destination: string;
    session: string;
    command: string;
    payload: any;
}
export interface StompSubscription {
    session: string;
    destination: string;
    id: string;
    isQueue: boolean;
    brokerPrefix: string;
}

// session help for each broker connection
export class StompSession {

    private _id: string;
    private _subscriptions: Map<String, Subject<StompMessage>>;
    private _client: StompClient;
    private _config: StompConfig;
    private galacticSubscriptions: Map<string, Subscription>;
    private isConnected: boolean = false;
    private connCount: number = 0;
    private _applicationDestinationPrefix: string;

    constructor(config: StompConfig, private log: Logger, private bus?: EventBus) {
        this._config = config;
        this._client = new StompClient(log, bus);
        this._id = GeneralUtil.genUUID();
        if (config.sessionId) {
            this._id = config.sessionId;
        }
        this._subscriptions = new Map<String, Subject<StompMessage>>();
        this.galacticSubscriptions = new Map<string, Subscription>();
        if (config.applicationDestinationPrefix) {
            this._applicationDestinationPrefix = config.applicationDestinationPrefix;
        }
    }

    public get connected(): boolean {
        return this.isConnected;
    }

    public set connected(val: boolean) {
        this.isConnected = val;
    }

    public get connectionCount(): number {
        return this.connCount;
    }

    public set connectionCount(val: number) {
        this.connCount = val;
    }

    get config(): StompConfig {
        return this._config;
    }

    get client(): StompClient {
        return this._client;
    }

    get id(): string {
        return this._id;
    }

    get applicationDestinationPrefix(): string {
        return this._applicationDestinationPrefix;
    }

    connect(messageHeaders?: any): Subject<Boolean> {
        return this._client.connect(this._config, messageHeaders);
    }

    send(destination: string, messageHeaders?: any, body?: any): boolean {
        return this._client.send(destination, messageHeaders, body);
    }

    subscribe(destination: string, id: string, headers?: any): Subject<StompMessage> {

        let subject: Subject<StompMessage> =
            this._client.subscribeToDestination(destination, id, headers);

        this._subscriptions.set(id, subject);
        return subject;
    }

    unsubscribe(id: string, headers?: any): void {
        this._client.unsubscribeFromDestination(id, headers);
        this._subscriptions.delete(id);
    }

    disconnect(messageHeaders?: any): void {
        this._client.disconnect(messageHeaders);
    }

    addGalacticSubscription(chan: string, subscription: Subscription): void {
        if (!this.galacticSubscriptions.has(chan)) {
            this.galacticSubscriptions.set(chan, subscription);
        }
    }

    getGalacticSubscription(chan: string): Subscription {
        return this.galacticSubscriptions.get(chan);
    }

    removeGalacticSubscription(chan: string): void {
        if (this.galacticSubscriptions.has(chan)) {
            this.galacticSubscriptions.delete(chan);
        }
    }

    getGalacticSubscriptions(): Map<string, Subscription> {
        return this.galacticSubscriptions;
    }
}

// stomp config.
export class StompConfig {

    private _useTopics: boolean = true;
    private _useQueues: boolean = false;
    private _topicLocation: string = '/topic';
    private _queueLocation: string = '/queue';
    private _startIntervalFunction: (handler: any, timeout?: any, ...args: any[]) => number;
    private _getAccessTokenFunction: () => string;
    private _accessTokenHeaderKey = DEFAULT_ACCESS_TOKEN_KEY;
    private _sendAccessTokenDuringHandshake = false;
    private _protocols: Array<string>;

    private numBrokerConnect: number = 1;
    public connectionSubjectRef: Subject<Boolean>; // used to manipulate multi connect messages from relays.
    public sessionId: UUID;
    public autoReconnect: boolean = true;

    static generate(endpoint: string,
                    host?: string,
                    port?: number,
                    useSSL?: boolean,
                    user?: string,
                    pass?: string,
                    applicationDesintationPrefix?: string) {

        return new StompConfig(
            endpoint,
            host,
            port,
            user,
            pass,
            useSSL,
            applicationDesintationPrefix
        );
    }

    private _testMode: boolean = false;

    constructor(private _endpoint: string,
                private _host?: string,
                private _port?: number,
                private _user?: string,
                private _pass?: string,
                private _useSSL?: boolean,
                private _applicationDestinationPrefix?: string,
                private _requireACK?: boolean,
                private _heartbeatIn: number = 0,
                private _heartbeatOut: number = 30000) {
    }

    set brokerConnectCount(count: number) {
        this.numBrokerConnect = count;
    }

    get brokerConnectCount(): number {
        return this.numBrokerConnect;
    }

    set topicLocation(val: string) {
        this._topicLocation = val;
    }

    get topicLocation() {
        return this._topicLocation;
    }

    set queueLocation(val: string) {
        this._queueLocation = val;
    }

    get queueLocation() {
        return this._queueLocation;
    }

    set useTopics(val: boolean) {
        this._useTopics = val;
    }

    set useQueues(val: boolean) {
        this._useQueues = val;
    }

    get useTopics() {
        return this._useTopics;
    }

    get useQueues() {
        return this._useQueues;
    }

    get host(): string {
        return this._host;
    }

    get endpoint(): string {
        return this._endpoint;
    }

    get port(): number {
        return this._port;
    }

    get user() {
        return this._user;
    }

    get pass(): string {
        return this._pass;
    }

    get useSSL(): boolean {
        return this._useSSL;
    }

    get requireACK(): boolean {
        return this._requireACK;
    }

    get testMode(): boolean {
        return this._testMode;
    }

    set testMode(val: boolean) {
        this._testMode = val;
    }

    get startIntervalFunction(): (handler: any, timeout?: any, ...args: any[]) => number {
       return this._startIntervalFunction;
    }

    set startIntervalFunction(fn: (handler: any, timeout?: any, ...args: any[]) => number) {
       this._startIntervalFunction = fn;
    }

    set heartbeatIn(interval: number) {
       this._heartbeatIn = interval;
    }

    get heartbeatIn(): number {
       return this._heartbeatIn;
    }

    set heartbeatOut(interval: number) {
       this._heartbeatOut = interval;
    }

    get heartbeatOut(): number {
       return this._heartbeatOut;
    }

    set getAccessTokenFunction(value: () => string) {
        this._getAccessTokenFunction = value;
    }

    get accessToken() {
        if (!this._getAccessTokenFunction) {
            throw new Error('getAccessTokenFunction not set');
        }
        return this._getAccessTokenFunction();
    }

    set accessTokenHeaderKey(value: string) {
        this._accessTokenHeaderKey = value;
    }

    get accessTokenHeaderKey() {
        return this._accessTokenHeaderKey;
    }

    set sendAccessTokenDuringHandshake(value: boolean) {
        this._sendAccessTokenDuringHandshake = value;
    }

    get sendAccessTokenDuringHandshake() {
        return this._sendAccessTokenDuringHandshake;
    }

    set protocols(value: Array<string>) {
        this._protocols = value;
    }

    get protocols() {
        return this._protocols;
    }

    public getConfig(): any {
        return {
            endpoint: this._endpoint,
            host: this._host,
            port: this._port,
            user: this._user,
            pass: this._pass,
            requireACK: this._requireACK,
            useSSL: this._useSSL,
            heartbeatIn: this._heartbeatIn,
            heartbeatOut: this._heartbeatOut,
            applicationDestinationPrefix: this._applicationDestinationPrefix,
            startIntervalFunction: this._startIntervalFunction
        };
    }

    public get applicationDestinationPrefix(): string {
        return this._applicationDestinationPrefix;
    }

    /* same as getConfig() just cleaner */
    get config(): Object {
        return this.getConfig();
    }

    public generateSocket(): any {
        let protocols = this.protocols;
        if (protocols) {
            // Make sure we don't mutate the client's array.
            protocols = protocols.slice();
        }
        if (this.sendAccessTokenDuringHandshake) {
            const accessToken = this.accessToken;
            const accessTokenProtocol = `${this.accessTokenHeaderKey}.${accessToken}`;
            if (!protocols) {
                protocols = [];
            }
            protocols.push(accessTokenProtocol);
        }        
        if (this._testMode) {
            return new MockSocket(this.generateConnectionURI(), protocols);
        } else {
            return new WebSocket(this.generateConnectionURI(), protocols);
        }
    }

    public generateConnectionURI(): string {
        let scheme: string = window.location.protocol === 'https:' ? 'wss' : 'ws';
        let hostPort: string = window.location.host;

        if (this._useSSL) {
            scheme = 'wss';
        }
        if (this._host) {
            hostPort = this._host;
        }

        if (this._port && this._port !== -1) {
            hostPort += ':' + this._port;
        }
        return scheme + '://'
            + hostPort
            + this._endpoint;

    }
}
