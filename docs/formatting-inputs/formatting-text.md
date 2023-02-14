# Formatting Text

Allows you to change a given text. In the following examples, we assume the output “trigger.value” is “Hello World”.

**substring(text, from, to)**

This function allows you to crop any text. The function accepts three parameters: The text to crop, from which character, and to which character.

|              Description             |                    Formula                   |  Result  |
| :----------------------------------: | :------------------------------------------: | :------: |
|  Returns from the characters 0 to 3  | \{{**substring**(trigger.value, **0, 3**)\}} |    Hel   |
|    Returns from characters 0 to 8    | \{{**substring**(trigger.value, **0, 8**)\}} | Hello Wo |
|    Returns from characters 3 to 8    | \{{**substring**(trigger.value, **3, 8**)\}} |   lo Wo  |
| Returns from characters 3 to the end |   \{{**substring**(trigger.value, **3**)\}}  | lo World |

**uppercase(text)**

|          Description          |               Formula              |    Result   |
| :---------------------------: | :--------------------------------: | :---------: |
| Returns the text in uppercase | \{{**uppercase**(trigger.value)\}} | HELLO WORLD |

**lowercase(text)**

|          Description          |               Formula              |    Result   |
| :---------------------------: | :--------------------------------: | :---------: |
| Returns the text in lowercase | \{{**lowercase**(trigger.value)\}} | hello world |
