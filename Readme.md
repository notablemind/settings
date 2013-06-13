
# settings

  Settings manager

## Installation

    $ component install notablemind/settings

## API

### getSettings('name') -> SettingsManager

Get a settingsmanager of the given name. If none exists, one is created.
The default settingsmanager is named "default".

### new SettingsManager()

All of the settingsmanager functions are aliased onto mondule.exports for the
default manager.

#### add(item)

Item is either a single

    {
      name: "str",
      value: mixed,
      description: "str",
      [type: "str",]
      [other attrs based on type]
    }

Or a container

    {
      name: "str",
      description: "str",
      settings: [item, item, ...],
      [type: "str",]
    }

Nested settings will be accessible by using "name.[name. ...]key".

#### get(name) -> value
#### set(name, value) -> null
#### json() -> JSON of the settings
#### load({name: value, ...})

## License

  MIT
