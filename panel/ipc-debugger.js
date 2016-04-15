(() => {
  'use strict';

  const Electron = require('electron');
  const ipcRenderer = Electron.ipcRenderer;

  Editor.polymerPanel( 'ipc-debugger', {
    properties: {
    },

    ready () {
      this.inspects = {};
      this.refresh();
    },

    _onRefresh () {
      this.refresh();
    },

    _onInspect ( event ) {
      event.stopPropagation();

      let model = event.model;
      // let item = this.$.list.itemForElement(event.target);
      let item = model.item;
      model.set( 'item.inspect', !item.inspect );
      event.target.classList.toggle( 'active', item.inspect );

      if ( item.level === 'core' ) {
        if ( item.inspect ) {
          Editor.Ipc.sendToMain( 'ipc-debugger:inspect', item.name );
        } else {
          Editor.Ipc.sendToMain( 'ipc-debugger:uninspect', item.name );
        }
      } else {
        if ( item.inspect ) {
          this.inspect(item.name);
        } else {
          this.uninspect(item.name);
        }
      }

      this.refresh();
    },

    inspect ( name ) {
      let fn = function () {
        let args = [].slice.call( arguments, 0 );
        args.unshift( 'ipc-debugger[page][' + name + ']' );
        Editor.success.apply( Editor, args );
      };
      this.inspects[name] = fn;
      ipcRenderer.on( name, fn );
    },

    uninspect ( name ) {
      let fn = this.inspects[name];
      if ( fn ) {
        ipcRenderer.removeListener( name, fn );
        delete this.inspects[name];
      }
    },

    refresh () {
      Editor.Ipc.sendToMain( 'ipc-debugger:query', (err, results) => {
        let ipcInfos = results.filter ( item => {
          return !/^ATOM/.test(item.name);
        });

        ipcInfos.sort(( a, b ) => {
          let result = a.level.localeCompare( b.level );
          if ( result === 0 ) {
            result = a.name.localeCompare(b.name);
          }
          return result;
        });

        ipcInfos = ipcInfos.map(item => {
          if ( item.level === 'page' ) {
            item.inspect = this.inspects[item.name] !== undefined;
          }
          return item;
        });

        this.set( 'ipcInfos', ipcInfos );
      });
    },
  });

})();
