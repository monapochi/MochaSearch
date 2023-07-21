# MochaSearch
A tiny full-text search engine for KVS written in Javascript.

# Usase


```javasctipt
import useMochaSearch from './MochaSearch'
const ms = useMochaSearch(1024, 'ja-JP') // size and  target language

const data = {
    keyToDoc1: 'Cats are the cutest animail in the world.'
}

ms.add(data['keyToDoc1'], 'keyToDoc1') // add index

const kw = 'animal'
const res = ms.search(kw) // query

const marked = ms.mark(data[res[0]], kw) // get marked text

console.log(marked)
```
