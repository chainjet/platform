# Formatting Numbers

Allows you to change a given number. In the following examples, we assume the output “trigger.amount” is 123456.78.

**formatNumber(number, language = ‘en’)**

Converts a number into a given language. If the language is not specified, English will be used by default.

<table><thead><tr><th align="center">Description</th><th width="333.3333333333333" align="center">Formula</th><th align="center">Result</th></tr></thead><tbody><tr><td align="center">Returns the number formatted in English</td><td align="center">{{<strong>formatNumber</strong>(trigger.amount)}}</td><td align="center">123,456.78</td></tr><tr><td align="center">Returns the number formatted in English</td><td align="center">{{<strong>formatNumber</strong>(trigger.amount, <strong>'en'</strong>)}}</td><td align="center">123,456.78</td></tr><tr><td align="center">Returns the number formatted in Spanish</td><td align="center">{{<strong>formatNumber</strong>(trigger.amount, <strong>'es'</strong>)}}</td><td align="center">123.456,78</td></tr></tbody></table>

**round(number, decimals)**

It allows you to round any number to a certain number of decimals.

<table><thead><tr><th width="312.3333333333333" align="center">Decription</th><th width="247" align="center">Formula</th><th align="center">Result</th></tr></thead><tbody><tr><td align="center">Returns the number rounded with zero decimals.</td><td align="center">{{<strong>round</strong>(trigger.amount, <strong>0</strong>)}}</td><td align="center">123457</td></tr></tbody></table>

This function is useful for correctly displaying the value of tokens. On Ethereum and Ethereum-compatible blockchains, numbers are stored as integers, and they have a field specifying how many decimals the token has.

For tokens with, for example, 18 decimals, you first need to divide it by 1e18 and then round it to the number of decimals you want. In these equations, we will use three decimals:

\{{**round**(177700150841340163 / **1e18, 3**)\}}&#x20;

\{{**round**(trigger.totalSupply / **1e18, 3**)\}}



_\*You can check in the contract of each token the number of decimals a token has and modify the equation shown accordingly._
