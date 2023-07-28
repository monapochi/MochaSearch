// Tiny Mocha Search
// Copyright (c) 2023 Shinichiro Naoi, Monas.

import BitSet from 'bitset'
import murmurhash3 from 'murmurhash3js'

let useNGram = false
const N = 1
let bitLength = 1024
let signatures = []
let keys = []
let documentsCount = 0
let segmenter = null

function segment(text) {
    if (text.length < 1) return []
    const segments = segmenter.segment(text)
    const words = []
    for (const seg of segments) {
        if (seg.isWordLike) words.push(seg.segment)
    }
    return words
}

function nGram(n, text) {
    if (text.length < 1) return []
    const words = []
    for (let i = 0; i < text.length; i++) {
        let ngram = text.slice(i, i + n)
        if (ngram) {
            words.push(ngram)
        }
    }
    return words
}

function convertToBitVector(words) {
    let bitSet = new BitSet()
    for (const word of words) {
        // k = 3
        const h1 = murmurhash3.x86.hash32(word, 1) % bitLength
        bitSet = bitSet.set(h1, true)
        const h2 = murmurhash3.x86.hash32(word, 2) % bitLength
        bitSet = bitSet.set(h2, true)
        const h3 = murmurhash3.x86.hash32(word, 3) % bitLength
        bitSet = bitSet.set(h3, true)
    }
    return bitSet
}

function add(text, key) {
    const words = useNGram ? nGram(N, text) : segment(text)
    const vec = convertToBitVector(words)
    let i = bitLength
    while (i--) {
        if(signatures[i] === undefined) {
            signatures[i] = new BitSet(vec.get(i) ? '1' : '0')
        } else {
            const b = signatures[i].toString().padStart(documentsCount, '0')
            if (vec.get(i)) {
                signatures[i] = new BitSet('1' + b)
            } else {
                signatures[i] = new BitSet('0' + b)
            }
        }
    }
    keys.push(key)
    documentsCount++
}

function search(text) {
    const result = new Set()
    if (text.length < 1) return result
    const words = useNGram ? nGram(N, text) : segment(text)
    const q = convertToBitVector(words)
    const searchBits = signatures.reduce((acc, sig, i) => {
        if (q.get(i)) {
            if (acc === undefined) {
                return sig
            } else {
                return acc.and(sig)
            }
        } else {
            return acc
        }
    }, undefined)
    let i = documentsCount
    while (i--) {
        if (searchBits.get(i)) {
            result.add(keys[i])
        }
    }
    return result
}

function getIndex() {
    return {
        keys,
        signatures,
        documentsCount,
        bitLength,
        lang: segmenter ? segmenter.resolvedOptions().locale : null
    }
}

function mark(text, query, marker = '<mark>', endMarker = '</mark>') {
    if (text === undefined) return ''
    if (query.length < 1) return text
    if (text.length < 1) return text
    const q = segment(query)
    for (const word of q) {
        text = text.replaceAll(word, `${marker}${word}${endMarker}`)
    }
    return text
}

function setIndex(index) {
    keys = index.keys
    signatures = index.signatures
    documentsCount = index.documentsCount
    init(index.bitLength, index.lang)
}

function init(length, lang) {
    if (length) {
        bitLength = length
    }
    if (lang) {
        useNGram = false
        segmenter = new Intl.Segmenter(lang, { granularity: 'word' })
    } else {
        useNGram = true
    }
}

function useMochaSearch(length, lang) {
    init(length, lang)
    return { add, search, getIndex, setIndex, mark }
}

export default useMochaSearch
