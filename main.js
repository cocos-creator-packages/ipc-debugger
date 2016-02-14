'use strict';

const Electron = require('electron');
const ipcMain = Electron.ipcMain;

const Async = require('async');

let _inspects = {};

module.exports = {
  load () {
  },

  unload () {
    for ( let name in _inspects ) {
      ipcMain.removeListener( name, _inspects[name] );
    }
  },

  messages: {
    open () {
      Editor.Panel.open('ipc-debugger.panel');
    },

    query ( event, reply ) {
      let windows = Editor.Window.windows;
      let infoList = [];

      for ( let p in ipcMain._events ) {
        let listeners = ipcMain._events[p];
        let count = Array.isArray(listeners) ? listeners.length : 1;
        infoList.push({
          name: p,
          level: 'core',
          count: count,
          inspect: _inspects[p] !== undefined,
        });
      }

      Async.each( windows, ( win, done ) => {
        win.sendRequestToPage( 'editor:query-ipc-events', infos => {
          if ( infos ) {
            infoList = infoList.concat(infos);
          }

          done();
        });
      }, () => {
        reply(infoList);
      });
    },

    inspect ( event, name ) {
      function fn () {
        let args = [].slice.call( arguments, 0 );
        args.unshift( 'ipc-debugger[core][' + name + ']' );
        Editor.success.apply( Editor, args );
      }

      _inspects[name] = fn;
      ipcMain.on( name, fn );
    },

    uninspect ( event, name ) {
      let fn = _inspects[name];
      if ( fn ) {
        ipcMain.removeListener( name, fn );
        delete _inspects[name];
      }
    },
  }
};
