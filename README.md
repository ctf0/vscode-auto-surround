you can have the same behavior with snippet but

- i got tired of having to create a snippet per each character
- the command `when` failing from realease to another [#86954](https://github.com/microsoft/vscode/issues/86954)
- some chracters surround text as expected in some languages but not in other

so this extension fixes that for good.

![demo](https://user-images.githubusercontent.com/7388088/72429426-97d38580-3798-11ea-9a47-322a6ab21679.gif)

## Notes

- the extension doesn't need any configuration, just make a selection and press the surrounding key
- doesn't support inputs because its not exposed to api yet
- https://github.com/Microsoft/vscode/issues/13441
