
# settings

  Settings manager - angular component

## Installation

    $ component install notablemind/settings

## API

### SettingsManager(structure)

#### Settings structure

    [
      {
        title: str,
        [type: str,]
        settings: [
          {
            name: str,
            [type: str,]
            value: ?,
            description: str,
            [other attrs depending on the type]
          }, ...
        ]
      }, ...
    ]

#### get(name) -> value
#### set(name, value) -> null
#### json() -> JSON of the settings
#### load({name: value, ...})

### Default Types

#### keyboard-shortcut (soon to be "type what you want")
#### bool (rendered as a checkbox)
#### radio (rendered as radio buttons)

### Plugin API

#### register(type, plugin)

Plugin:

    {
      validate: function (value, setting) ->
         (null == valid | string == error message)
      template: str. This is rendered with the setting scope, with vbls
        - setting: {setting obj}
        - validate: fn
    }

Plugin components are *not* to register themselves. They are, by
convention, to expose this plugin object as the module.exports.

## License

  MIT
