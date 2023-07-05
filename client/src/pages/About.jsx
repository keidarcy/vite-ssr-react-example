import React from 'react'
import Button from '@material-ui/core/Button';
import { addAndMultiply } from '../add'
import { multiplyAndAdd } from '../multiply'

export default function About() {
  return (
    <>
      <h1>About</h1>
    <Button variant="contained" color="primary">
      Hello World
    </Button>
      <div>{addAndMultiply(1, 2, 3)}</div>
      <div>{multiplyAndAdd(1, 2, 3)}</div>
    </>
  )
}
