#Contributing to miniLock

##Coding style for contributions
Please be mindful that you are contributing to security and encryption software. We expect all code to be pre-reviewed for security and to be of high quality.  

All contributed code, written in JavaScript, must adhere to the following coding style:  
	1. Tabs are used for indentation, **not** spaces.  
	2. Lines are **not** ended with semicolons.  
	3. Use camel case for variables, filenames, and so on.  
	4. As a rule, use single quotes, (such as 'string'), not double quotes ("string").  
	5. As a rule, strict-type isEqual is preferred (1 **===** 1 instead of 1 **==** 1).  
	6. Please comment your code sufficiently.  
	7. Anonymous closures should be used wherever they are useful.  
	8. Brackets are not on new lines.  
	9. [Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode) must be enforced at all times.

##Tests
* Run tests using `make tests`.
* Make sure your code conforms by running `make lint`.

##License
All contributed code will automatically be licensed under the [GNU Affero General Public License (AGPL3)](https://www.gnu.org/licenses/agpl-3.0.html).  
The full license text is included in `LICENSE.md`.  

##Discussion & Blog
* Coming soon.  

##Contributors
* **Dmitry Chestnykh**: TweetNaCL library.  
* **Nadim Kobeissi**: Lead developer. Created Cryptocat.  