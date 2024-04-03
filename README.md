# New Architecture Helper

<img width="1022" alt="image" src="https://github.com/aleqsio/new-arch-helper/assets/5597580/e479f163-527b-45e1-afb4-d28d5ee9a33f">

[![npm version](https://badge.fury.io/js/new-arch.svg)](https://badge.fury.io/js/new-arch)

Based on [this spreadsheet](https://docs.google.com/spreadsheets/u/1/d/1F1tI9PQLl_uab3HNYNwgjPVL2r0hJ9VymXcgDp5etdg/edit?usp=sharing) mentioned in https://github.com/reactwg/react-native-new-architecture/discussions/167.

NewArch Helper is a package that allows you to easily check if the autolinked dependencies in your react-native project have been tested with new architecture and bridgeless enabled.

Run `npx new-arch` inside your project directory to get a report listing known state of support for each package.

# How it works

It simply looks up each dependency in the spreadsheet – it's not a static code analysis tool or something like that.

Only dependencies that have native code and are autolinked are listed.

There might be packages that work despite being listed as having problems, or might break even though they are listed as having been tested.

If you find such a case, let me know so that we can update the data or add a new library to the list.
