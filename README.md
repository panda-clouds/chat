
<PCName>
=========
maintained by [PandaClouds.com](https://pandaclouds.com)

`<PCName>` provides a clean way to <description>.


Installation
------------

1. If you want to use this library, you first need to install the [Node.js](https://nodejs.org/en/).

2. When you install node.js, will also be installed [npm](https://www.npmjs.com/).

3. Please run the following command.

```
npm install --save @panda-clouds/<panda-blank>
```

Usage
-----

### Node.js

```javascript
const <PCName> = require('@panda-clouds/<panda-blank>');

// example usage

```

You can replace <PCName> with any variable.


Methods
-------

[Unit Tests] are an additional resource for learning functionality.

### - mustExist()

requires the property to be set,
else throws error

Example:

```javascript
Parse.Cloud.beforeSave('Book', request =>{
	const data = new <PCName>(request);
	data.prop('title').mustExist();    // will throw Error if request.object.get('title') doesn't exist
});
```



Contributions
-------------

Pull requests are welcome! here is a checklist to speed things up:

- modify `<PCName>.js`
- add unit tests in `<PCName>.spec.js`
- run `npm test`
- document method in `README.md`
- add your name to 'Contributors' in `README.md`


### Contributors

(Add your name)

- [*] [Marc Smith](https://github.com/mrmarcsmith)


[Unit Tests]: https://github.com/panda-clouds/string/blob/master/spec/<PCName>.spec.js
