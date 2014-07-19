#miniLock Unit Test Kit

##Instructions
miniLock Unit Test Kit (mUTK) is a set of unit tests that attempt to evaluate miniLock's functional sanity from the user's potential environment.

In order to run mUTK, do the following (just opening `index.html` will not work):

1. `cd` into the `test` directory of the miniLock codebase (this directory).
2. `python -m SimpleHTTPServer`
3. Visit [the resulting web server](http://127.0.0.1:8000).

##Notes
miniLock Unit Test Kit covers miniLock directly, and its dependencies/libraries only indirectly. For the unit tests of the libraries miniLock uses, please visit their respective codebases as listed in `RESOURCES.md`.