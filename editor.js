Changes = new Meteor.Collection("changes");

if (Meteor.is_client) {
  var uuid = Meteor.uuid()

  function init() {
    var ta = document.getElementById("ta")
    var onChangeEnabled = true
    function onChange(m, evt){
      // console.log('onChange:', m, evt)
      while (evt) {
        if (onChangeEnabled) {
          Changes.insert({uuid: uuid, date: new Date(), text: evt.text, from: evt.from, to: evt.to})
        }
        //exec(evt, mirror)
        evt = evt.next
      }
      var d = window.parent.dynamicframe.document;
      d.open();d.write(m.getValue());d.close();
    }
    m = CodeMirror.fromTextArea(ta, {mode: "text/html", tabMode: "indent", electricChars: false, indentWithTabs: false, tabSize: 2, smartIndent: false, onChange: onChange});
    m.focus();
    m.setSelection({line:0, ch:0}, {line:m.lineCount(), ch:0});
    var changes = Changes.find({}, {sort: {date: 1}})
    // execute the modification on the mirror
    function exec(evt, mirror) {
      onChangeEnabled = false
      try {
        if (evt.uuid != uuid) {
          mirror.replaceRange(evt.text.join('\n'), evt.from, evt.to)
        }
      } finally {
        onChangeEnabled = true
      }
    }
    window.reset_textarea = function(skip){
      onChangeEnabled = false
      try {
        m.replaceRange('', {line: 0, ch: 0}, {line:m.lineCount(), ch:0})
        if (!skip) {
          Changes.remove({})
          Changes.insert({uuid: uuid, date: new Date(), action: 'reset'})
        }
      } finally {
        onChangeEnabled = true
      }
    }
    var date = 0
    changes.forEach(function(ch) {
      date = Math.max(new Date(ch.date).getTime(), date)
      if (ch.action == 'reset') {
        window.reset_textarea()
      } else {
        exec(ch, m)
      }
    })
    if (date === 0) date = undefined
    Changes.find({date: {$gt: new Date(date)}, uuid: {$ne: uuid}}).observe({
      added: function (ch) {
        if (uuid != ch.uuid) {
          if (ch.action == 'reset') {
            window.reset_textarea(true)
          } else {
            exec(ch, m)
          }
        }
      }
    })
  }
  Meteor.startup(function(){
    init()
  })
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}