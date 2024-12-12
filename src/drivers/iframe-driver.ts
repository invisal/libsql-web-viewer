"use client";
import { DatabaseResultSet } from "./base-driver";
import MySQLLikeDriver from "./mysql/mysql-driver";
import PostgresLikeDriver from "./postgres/postgres-driver";
import { SqliteLikeBaseDriver } from "./sqlite-base-driver";

type ParentResponseData =
  | {
      type: "query";
      id: number;
      data: DatabaseResultSet;
      error?: string;
    }
  | {
      type: "transaction";
      id: number;
      data: DatabaseResultSet[];
      error?: string;
    };

type PromiseResolveReject = {
  resolve: (value: any) => void;
  reject: (value: string) => void;
};

abstract class EmbedConnection {
  abstract listen(): void;
  abstract custom<PayloadType = unknown, ResponseType = unknown>(
    event: string,
    payload?: PayloadType
  ): Promise<ResponseType>;
  abstract query(stmt: string): Promise<DatabaseResultSet>;
  abstract transaction(stmts: string[]): Promise<DatabaseResultSet[]>;
}

class IframeConnection implements EmbedConnection {
  protected counter = 0;
  protected queryPromise: Record<number, PromiseResolveReject> = {};

  listen() {
    const handler = (e: MessageEvent<ParentResponseData>) => {
      if (e.data.error) {
        this.queryPromise[e.data.id].reject(e.data.error);
        delete this.queryPromise[e.data.id];
      } else {
        this.queryPromise[e.data.id].resolve(e.data.data);
        delete this.queryPromise[e.data.id];
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }

  custom<PayloadType = unknown, ResponseType = unknown>(
    event: string,
    payload?: PayloadType
  ): Promise<ResponseType> {
    return new Promise((resolve, reject) => {
      const id = ++this.counter;
      this.queryPromise[id] = { resolve, reject };

      window.parent.postMessage(
        {
          type: event,
          id,
          payload,
        },
        "*"
      );
    });
  }

  query(stmt: string): Promise<DatabaseResultSet> {
    return new Promise((resolve, reject) => {
      const id = ++this.counter;
      this.queryPromise[id] = { resolve, reject };

      window.parent.postMessage(
        {
          type: "query",
          id,
          statement: stmt,
        },
        "*"
      );
    });
  }

  transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    return new Promise((resolve, reject) => {
      const id = ++this.counter;
      this.queryPromise[id] = { resolve, reject };

      window.parent.postMessage(
        {
          type: "transaction",
          id,
          statements: stmts,
        },
        "*"
      );
    });
  }
}

class ElectronConnection implements EmbedConnection {
  listen() {
    // do nothing here
  }

  custom<PayloadType = unknown, ResponseType = unknown>(
    event: string,
    payload?: PayloadType
  ): Promise<ResponseType> {
    if (window.outerbaseIpc.connectCustomEvent) {
      return window.outerbaseIpc.connectCustomEvent(
        event,
        payload
      ) as Promise<ResponseType>;
    }

    return Promise.reject("Not implemented");
  }

  query(stmt: string): Promise<DatabaseResultSet> {
    return window.outerbaseIpc.query(stmt);
  }

  transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    return window.outerbaseIpc.transaction(stmts);
  }
}

export function detectEmbedConnection() {
  if (typeof window !== "undefined" && window?.outerbaseIpc) {
    return new ElectronConnection();
  } else {
    return new IframeConnection();
  }
}

export class IframeSQLiteDriver extends SqliteLikeBaseDriver {
  constructor(
    public conn: EmbedConnection,
    options?: { supportPragmaList: boolean }
  ) {
    super();

    if (options?.supportPragmaList !== undefined) {
      this.supportPragmaList = options.supportPragmaList;
    }
  }

  listen() {
    this.conn.listen();
  }

  close(): void {}

  async query(stmt: string): Promise<DatabaseResultSet> {
    const r = await this.conn.query(stmt);
    return r;
  }

  transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    const r = this.conn.transaction(stmts);
    return r;
  }
}

export class IframeMySQLDriver extends MySQLLikeDriver {
  constructor(public conn: EmbedConnection) {
    super();
  }

  listen() {
    this.conn.listen();
  }

  close(): void {}

  async query(stmt: string): Promise<DatabaseResultSet> {
    const r = await this.conn.query(stmt);
    return r;
  }

  transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    const r = this.conn.transaction(stmts);
    return r;
  }
}

export class IframePostgresDriver extends PostgresLikeDriver {
  constructor(public conn: EmbedConnection) {
    super();
  }

  listen() {
    this.conn.listen();
  }

  close(): void {}

  async query(stmt: string): Promise<DatabaseResultSet> {
    const r = await this.conn.query(stmt);
    return r;
  }

  transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    const r = this.conn.transaction(stmts);
    return r;
  }
}
