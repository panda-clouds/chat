
new-npm-module
=========
maintained by [PandaClouds.com](https://pandaclouds.com)

`new-npm-module` provides a clean way to create a new Panda Clouds npm module.


Usage
-----

1. Create the desired "new" repo on github. We will use a "birthday" module as an example
2. clone "new" into directory "X"
3. clone this project into the same directory "X"
4. open terminal
5. cd /my/dirX
6. replace the "birthday" in this script with the name of your "new" repo
```
export NEW_NPM_PROJECT="birthday" && ls ./${NEW_NPM_PROJECT} && cp -r ./new-npm-module/* ./${NEW_NPM_PROJECT} && cp ./new-npm-module/.eslintignore ./${NEW_NPM_PROJECT} && cp ./new-npm-module/.eslintrc.js ./${NEW_NPM_PROJECT} && cp ./new-npm-module/.gitignore ./${NEW_NPM_PROJECT} && cp ./new-npm-module/.npmrc-deploy ./${NEW_NPM_PROJECT} && rm ./${NEW_NPM_PROJECT}/README.md && mv ./${NEW_NPM_PROJECT}/new_README.md ./${NEW_NPM_PROJECT}/README.md
```
7. paste the command in to termial and press "enter"
8. commit and push the "new" repo to github
9. rename src/<PCName>.js with "PCBirthday.js" or equivelant
9. rename spec/<PCName>.spec.js with "PCBirthday.spec.js" or equivelant
9. rename <PCName> in "spec/PCBirthday.spec.js" or equivelant
9. in "README.md" AND "package.json" replace all:
	- "<PCName>" with "PCBirthday" or equivelant
	- "<panda-blank>" with "birthday" or equivelant
	- "<description>" with a one line secription of the module
11. README.md: in the "Methods" section: Document all methods with examples
11. README.md: in the "Usage" section: add an "end to end" example that uses all the functions together

### Contributors

(Add your name)

- [*] [Marc Smith](https://github.com/mrmarcsmith)

