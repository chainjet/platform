## **Formatting your Messages**

### Intervals:

Intervals can be used to show only a portion of a text. Here are some formulas you can use:  
If trigger.value = 'hello world'  
{{ substring(trigger.value, 0, 3) }} => hel: The text goes from the characters 0 to 3.  
{{ substring(trigger.value, 0, 8) }} => hello wo: The text goes from characters 0 to 8.  
{{ substring(trigger.value, 3, 8) }} => lo wo: The text goes from characters 3 to 8.  
{{ substring(trigger.value, 3) }} => lo world: The text goes from characters 3 to the end.

If trigger.value = 'hello world'  
{{ lowercase(trigger.value) }} => hello world  
{{ uppercase(trigger.value) }} => HELLO WORLD

Give format to numbers  
For numbers, here are some simple formats:

Decimal punctuation marks:  
If trigger.amount = 123456.78  
{{ formatNumber(trigger.amount) }} => 123,456.78  
{{ formatNumber(trigger.amount, 'en') }} => 123,456.78  
{{ formatNumber(trigger.amount, 'es') }} => 123.456,78

### Rounding of decimals:

For tokens with, say, 18 decimals, you first need to divide it by 1e18 and then round it to the amount of decimals you want. In these equations, we will use 3 decimals:  
{{round(177700150841340163 / 1e18, 3)}}  
{{round(634710d25b635e0ab7e75379.totalSupply / 1e18, 3)}}

You can check in the contract of each token the number of decimals a token has and modify the equation shown accordingly. Bear in mind that all spaces and parenthesis added are important.

You can also round numbers to decimals following this equation:  
{{round(..., 2)}}  
{{round(635802872a7c3cec244d9dec.pairs\[0\].priceUsd, 2)}}

In this case we will have only two decimals, but you can enter any number you want.