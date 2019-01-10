declare module 'parse5' {
  namespace MarkupData {
    interface Location {
      /**
       * One-based line index
       */
      line: number;
      /**
       * One-based column index
       */
      col: number;
      /**
       * Zero-based first character index
       */
      startOffset: number;
      /**
       * Zero-based last character index
       */
      endOffset: number;
    }

    interface AttributesLocation {
      [attributeName: string]: Location;
    }

    interface StartTagLocation extends Location {
      /**
       * Start tag attributes' location info
       */
      attrs: AttributesLocation
    }

    interface ElementLocation extends StartTagLocation {
      /**
       * Element's start tag location info.
       */
      startTag: StartTagLocation;
      /**
       * Element's end tag location info.
       */
      endTag: Location;
    }

  }
}


declare module 'fake-indexeddb' {}
declare module 'fake-indexeddb/lib/FDBDatabase' {
  interface FDBDatabase extends IDBDatabase {}
}
declare module 'fake-indexeddb/lib/FDBKeyRange' {
  interface FDBKeyRange extends IDBKeyRange {}
}

