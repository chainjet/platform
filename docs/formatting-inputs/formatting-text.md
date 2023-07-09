# Formatting Text

Allows you to change a given text. In the following examples, we assume the output “trigger.value” is “Hello World”.

**substring(text, from, to)**

This function allows you to crop any text. The function accepts three parameters: The text to crop, from which character, and to which character.

<table><thead><tr><th width="268" align="center">Description</th><th width="314.3333333333333" align="center">Formula</th><th align="center">Result</th></tr></thead><tbody><tr><td align="center">Returns from the characters 0 to 3</td><td align="center">{{<strong>substring</strong>(trigger.value, <strong>0, 3</strong>)}}</td><td align="center">Hel</td></tr><tr><td align="center">Returns from characters 0 to 8</td><td align="center">{{<strong>substring</strong>(trigger.value, <strong>0, 8</strong>)}}</td><td align="center">Hello Wo</td></tr><tr><td align="center">Returns from characters 3 to 8</td><td align="center">{{<strong>substring</strong>(trigger.value, <strong>3, 8</strong>)}}</td><td align="center">lo Wo</td></tr><tr><td align="center">Returns from characters 3 to the end</td><td align="center">{{<strong>substring</strong>(trigger.value, <strong>3</strong>)}}</td><td align="center">lo World</td></tr></tbody></table>

**uppercase(text)**

<table><thead><tr><th width="274.3333333333333" align="center">Description</th><th width="258" align="center">Formula</th><th align="center">Result</th></tr></thead><tbody><tr><td align="center">Returns the text in uppercase</td><td align="center">{{<strong>uppercase</strong>(trigger.value)}}</td><td align="center">HELLO WORLD</td></tr></tbody></table>

**lowercase(text)**

<table><thead><tr><th width="277.3333333333333" align="center">Description</th><th width="256" align="center">Formula</th><th align="center">Result</th></tr></thead><tbody><tr><td align="center">Returns the text in lowercase</td><td align="center">{{<strong>lowercase</strong>(trigger.value)}}</td><td align="center">hello world</td></tr></tbody></table>
