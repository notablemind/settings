
# settings

  Settings manager

## Installation

    $ component install notablemind/settings

## API

### module.exports = default settings manager

### getSettings('name') -> SettingsManager

Get a settingsmanager of the given name. If none exists, one is created.
The default settingsmanager is named "default".

### new SettingsManager()

#### config(items)

setup settings.

     items: { key: setting, ... }
       key: can't contain "."
       setting: [ single | group ]
       group: { _group: true, key: setting, [key:setting, ...]}
       single: {
         title: str,
         description: str,
         class: HTML class to be applied when displayed
         type: str
         ... type-specific options
       }
    
     prefix: string; the place to insert the settings. "." separated path
     override: (default false). If false, an error is raised if a
               setting is already present.

Nested settings will be accessible by using "name.[name. ...]key".

#### get(name) -> value
#### set(name, value) -> null
#### json() -> JSON of the settings
#### load({name: value, ...})
#### proxy(path)
create a proxy, which treats all commands as relative to the provided path
#### match(pattern)
Returns the list of settings that match the pattern.
"*" will match everything but "*", "**" will match everything.

#### getList(list[, path])
Resolve a list of settings (optionally offset by path).

    [setting, ...] -> [value, ...]

#### getHash(hash[, path])
Resolve the values of a hash (optionally offset by path).

    {key: setting, ...} -> {key: value, ...}

#### getHashKeys(kash[, path])
Resolve the keys of a hash (optionally offset by a path).

    {setting: thing, ...} -> {value: thing, ...}

#### clear()
Clear out all settings.

## License

  MIT
