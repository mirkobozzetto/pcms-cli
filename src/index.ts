#!/usr/bin/env node
import { createProgram } from './cli.js'

createProgram().parseAsync(process.argv)
