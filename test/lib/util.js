'use strict';

function a(word) {
  return word.match(/^[aeiou]/) ? 'an' : 'a';
}

/**
 * A {@link Tree<X, Y>} is a Rose Tree whose edges are labeled with values of
 * type `X`, and whose nodes are labeled with values of type `Y`.
 * @typedef {Map<X, Pair<Y, Tree<X, Y>>} Tree<X, Y>
 */

/**
 * Reduce a {@link Tree<X, Y>}.
 *
 * This function is like Array's `reduce`, generalized to {@link Tree<X, Y>}s.
 * Given a reducing function, `f`, that combines a value of type `Y` with an
 * Array of values of type `Z`, this function traverses the {@link Tree<X, Y>}
 * in-order, "flattening" the values labeling each node into an Array of values
 * of type `Z`.
 *
 * This function ignores the values of type `X` labeling the edges of the
 * {@link Tree<X, Y>}.
 *
 * This function is adapted from `foldTree` in the Haskell `containers` package.
 * See here: https://hackage.haskell.org/package/containers/docs/Data-Tree.html
 *
 * @param {Tree<X, Y>} tree - the {@link Tree<X, Y>} to reduce
 * @param {function(Y, Array<Z>): Z} f - the reducing functions
 * @param {Y} y - an initial value of type `Y` to reduce
 * @returns {Z} z - the reduced value of type `Z`
 */
function reduce(tree, f, y) {
  /**
   * Reduce a level of a {@link Tree<X, Y>}.
   * @param {Tree<X, Y>} tree
   * @param {function(Y, Array<Z>): Z} f
   * @returns {Array<Z>}
   */
  function reduceLevel(tree, f) {
    // For every node,
    return [...tree.values()].map(([y, subtree]) => {
      // Reduce its subtree;
      const zs = reduceLevel(subtree, f);

      // Then combine the value of type `Y` labeling the node with the Array of
      // values of type `Z` reduced from the subtree.
      return f(y, zs);
    });
  }

  return f(y, reduceLevel(tree, f));
}

/**
 * Insert into a {@link Tree<X, Y>}. If a subtree at X exists, return it;
 * otherwise, create it.
 * @param {Tree<X, Y>} tree
 * @param {X} x
 * @param {Y} y
 * @returns {Tree<X, Y>} subtree
 */
function getOrCreate(tree, x, y) {
  if (!tree.has(x)) {
    tree.set(x, [y, new Map()]);
  }
  return tree.get(x)[1];
}

/**
 * Generate combination `contexts`. This function is useful for testing many
 * different combinations with Mocha.
 *
 * @example
 * combinationContext([
 *   [[1, 2], x => x],
 *   [[3, 4], y => y]
 * ], ([x, y]) => {
 *   it('works', () => {});
 * });
 *
 * //
 * //   1
 * //     3
 * //       ✓ works
 * //     4
 * //       ✓ works
 * //
 * //   2
 * //     3
 * //       ✓ works
 * //     4
 * //       ✓ works
 * //
 * //   4 passing (8ms)
 * //
 *
 * @param {Array<Pair<Array<*>, function(*): string>>} pairs
 * @param {function(Array<*>): void} callback
 * @returns {void}
 */
function combinationContext(pairs, callback) {
  const xss = pairs.map(pair => pair[0]);

  // Build up a Tree, whose edges are labeled with elements of the combinations
  // (or null, if the edge points to a leaf node) and whose nodes are labeled
  // with values of type
  //
  //   function(function(): void): void
  //
  // These values labeling are either `context`s bound to the given description
  // strings, or a function which will invoke the `callback` with a particular
  // `combination`.
  const tree = combinations(xss).reduce((tree, combination) => {
    combination.reduce((tree, x, i) => {
      const description = pairs[i][1](x);

      const subtree = getOrCreate(
        tree,
        x,
        callback => context(description, callback));

      if (i === combination.length - 1) {
        getOrCreate(
          subtree,
          null,
          () => callback(combination));
      }

      return subtree;
    }, tree);

    return tree;
  }, new Map());

  // Now reduce the Tree. At every level, invoke each `callback`'s `children`
  // in order.
  reduce(tree, (callback, children) => () =>
    callback(() => children.forEach(child => child()))
  , callback => callback())();
}

/**
 * Generate combinations by taking the Cartesian product of Arrays.
 * @param {Array<Array<*>>} xss
 * @param {function(X, Y): Z} [combine]
 * @returns {Array<*>} zs
 */
function combinations(xss) {
  return xss.reduce((xs, ys) => {
    return product(xs, ys, (x, y) => x.concat(y));
  }, [[]]);
}

/**
 * Take the product of two Arrays. The combine function defaults to Cartesian
 * product.
 * @param {Array<X>} xs
 * @param {Array<Y>} ys
 * @param {function(X, Y): Z} [combine]
 * @returns {Array<Z>} zs
 */
function product(xs, ys, combine) {
  combine = combine || ((x, y) => [x, y]);
  return xs.reduce((zs, x) => {
    return zs.concat(ys.map(y => combine(x, y)));
  }, []);
}

function randomName() {
  return Math.random().toString(36).slice(2);
}

exports.a = a;
exports.combinationContext = combinationContext;
exports.combinations = combinations;
exports.randomName = randomName;
