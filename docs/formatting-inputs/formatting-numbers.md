# Formatting Numbers

Allows you to change a given number. In the following examples, we assume the output “trigger.amount” is 123456.78.

**formatNumber(number, language = ‘en’)**

Converts a number into a given language. If the language is not specified, English will be used by default.

|               Description               |                      Formula                     |   Result   |
| :-------------------------------------: | :----------------------------------------------: | :--------: |
| Returns the number formatted in English |      \{{**formatNumber**(trigger.amount)\}}      | 123,456.78 |
| Returns the number formatted in English | \{{**formatNumber**(trigger.amount, **'en'**)\}} | 123,456.78 |
| Returns the number formatted in Spanish | \{{**formatNumber**(trigger.amount, **'es'**)\}} | 123.456,78 |

**round(number, decimals)**

It allows you to round any number to a certain number of decimals.

|                   Decription                   |                 Formula                | Result |
| :--------------------------------------------: | :------------------------------------: | :----: |
| Returns the number rounded with zero decimals. | \{{**round**(trigger.amount, **0**)\}} | 123457 |

This function is useful for correctly displaying the value of tokens. On Ethereum and Ethereum-compatible blockchains, numbers are stored as integers, and they have a field specifying how many decimals the token has.

For tokens with, for example, 18 decimals, you first need to divide it by 1e18 and then round it to the number of decimals you want. In these equations, we will use three decimals:

\{{**round**(177700150841340163 / **1e18, 3**)\}}&#x20;

\{{**round**(trigger.totalSupply / **1e18, 3**)\}}

__

_\*You can check in the contract of each token the number of decimals a token has and modify the equation shown accordingly._
