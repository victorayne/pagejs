(function( global ) {
"use strict";
//TODO
//Make Neqti JS reduceable. Whereby users can select to allow only specific funtions.

/**
 * Naming convention for Neqti.
 * Global function and (Class or Prototype) methods should be named in camelCase.
 * 
 * Functions in called should be named in underscore dashe_rized format.
 */
var fn,
    doc = document,
    guid = 0,
    emptyObject = {},
    emptyArray = [],
    $_concat = emptyArray.concat,
    $_filter = emptyArray.filter,
    indexOf = emptyArray.indexOf,
    push = emptyArray.push,
    slice = emptyArray.slice,
    some = emptyArray.some,
    splice = emptyArray.splice,

    version = "3.7",

    //css selector regex
    idRe = /^#[\w-]+$/,
    classRe = /^\.[\w-]+$/,
    tagRe = /^[a-zA-Z]+$/,
    htmlRe = /^<.+>$/,
    htmlTagRe = /^<([a-zA-Z](?:[a-zA-Z-]+)?)>$/,
    //start and end
    htmlReStart = /^<([a-z]+)(?:[^>]+)?>/i,
    htmlReEnd = /<\/([a-z]+)>$/i,
    //self tag
    htmlSelfRe = /^<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(?:\s(?:[a-z][a-z-]+)?[a-z]+(?:=('|").*\1)?)*(?:\s*\/)?>$/i,
    
    //is
    is_neqti = function( object ) {
        return object instanceof Neqti
    },
    is_window = function( global ) {
        return !!global && global === global.window
    },
    is_function = function( func ) {
        return "function" === typeof func
    },
    is_numeric = function( num ) {
        return !isNaN( parseFloat( num ) ) && isFinite( num )
    },
    is_string = function( string ) {
        return "string" === typeof string
    },
    is_undefined = function( variable ) {
        return "undefined" === typeof variable
    },
    is_document = function( doc ) {
        return !!doc && doc.nodeType === 9
    },
    is_element = function( element ) {
        return !!element && element.nodeType === 1
    },
    is_null = function( object ) {
        return object === null
    },
    is_boolean = function( bool ) {
        return "boolean" === typeof bool
    },
    is_object = function( object ) {
        //don't recognize null as object
        return !!object && "object" === typeof object
    },
    is_array = Array.isArray || function( object ) {
        return "array" === type( object )
    },
    is_plain_object = function( object ) {
        var proto;
        // Objects with no prototype (e.g., `Object.create( null )`) are plain also.
        return object && "object" === type( object ) && ( !( proto = Object.getPrototypeOf( object ) ) || proto == Object.prototype )
    },
    is_empty_object = function( object ) {
        var name;
        for (name in object) return false;
        return true
    },
    in_array = function( item, array, start ) {
		return array == null ? -1 : indexOf.call( array, item, start );
	};

function is_array_like( obj ) {
	var length = !!obj && "length" in obj && obj.length,
        //reason i didn't call type() direct is cus of overwritting
        type   = Neqti.type( obj );

    return "function" !== type && !is_window( obj ) && (
      "array" === type || length === 0 ||
        ( typeof length === "number" && length > 0 && ( length - 1 ) in obj )
    )
}

/**
 * @see neqti();
 */
function Neqti( selector, context ) {
    return new neqti( selector, context )
}
    
/**
 * Neqti Initialization
 * @param  {String} HTML parse or CSS selector to query.
 * @param  {Object} Optional. Where to select from. Can also be attributes for parsed HTML.
 * @return Base on passed test, returns selector or Neqti.
 */
function neqti( selector, context ) {
    if ( selector ) {
        if ( is_string( selector ) )
            selector = htmlRe.test( selector ) ? parse_html( selector, context ) : find( selector, context );
        else
        if ( is_neqti( selector ) )
            return selector;
        else
        if ( is_function( selector ) )
            return this.ready( selector );
        
        var i, length, elements = selector;
        
        //document & window
        if ( elements.nodeType || elements === global )
            elements = [ elements ];
        
        //don't work without length
        if ( elements.length ) {
            this.length = elements.length;
            //changed from this.length
            for ( i = 0, length = elements.length; i < length; i++ )
                this[ i ] = elements[ i ];
        }
    }
}

// TODO: Learn why neqti and Neqti must have same prototype.
//Neqti and neqti initialization should have same prototype 
fn = neqti.prototype = Neqti.prototype = {
    constructor: Neqti,
    length: 0,
    version: version,
    guid: 0
};


/**
 * For selecting id, class, tag - elements.
 * @param  @string Element css selector to query.
 * @param  Where to find selector from, default is document.
 * @return Array.
 */
function find( selector, context ) {
    var blank = [], is_doc;
    context = context || doc;
    return !selector || !is_element( context ) && !( is_doc = is_document( context ) ) ? blank :
        //context for id must be document. Element as context causes error
        //id gets only first element like default
        ( is_doc && idRe.test( selector ) ? context.getElementById( selector.slice( 1 ) ) :
        //class
        classRe.test( selector ) ? context.getElementsByClassName( selector.slice( 1 ) ) :
        //tag
        tagRe.test( selector ) ? context.getElementsByTagName( selector ) :
        //all selector
        context.querySelectorAll( selector ) ) || blank;//fallback
}


/**
 * Parses html tags and create new element.
 * length feature lets you make clones according to length specified.
 * @param  @string Html tag. e.g <div>
 * @param  @object Optional. Plain object. Can parse default create elements values through
 * @return Array.
 */
function parse_html( html, context ) {
    var create,
        parent,
        length,
        elements = [];
    
    if ( is_string( html ) ) {
        context = is_plain_object( context ) ? context : {};
        length = context.length || 1;
        
        //parentNode
        parent = doc.createElement( "div" );
        parent.id = "neqti-js-builder";
        
        //create by <tagName> or self closing <tagName/> or by <tagName>.*</tagName>
        htmlTagRe.test( html ) ? parent.appendChild( doc.createElement( RegExp.$1 ) ) : ( htmlSelfRe.test( html ) || ( htmlReStart.test( html ) && ( create = RegExp.$1 ) && htmlReEnd.test( html ) && create === RegExp.$1) ) && ( parent.innerHTML = html );
        
        //do if create is defined
        if ( is_element( create = parent.children[ 0 ] ) ) {
            each( context, function( value, prop ) {
                if ( create[ prop ] != undefined ) create[ prop ] = value
            } )
      
            loop( length, function( i ) {
                //push first & clone rest if needed
                !i ? elements.push( create ) : elements.push( create.cloneNode( true ) )
            } )
        }
    }
    
    return elements
}


/**
 * Camelize strings that has dashed characters.
 * @param  @string Text to camelize.
 * @return Camelized string.
 */
function camelize( string ) {
    return string.replace(/(?:-|_)+(.)?/g, function( match, letter ){
        return letter ? letter.toUpperCase() : ""
    })
}

/**
 * Change cased/camel characters to dasherize with custom separators.
 * @param  @string Camel text to dasherize.
 * @param  @string A custom separator.
 * @return Dasherized string in lowercase.
 */
function dasherize( string, sep ){
    return string.replace(/([a-z\d])([A-Z])/g, "$1" + (sep || "-") + "$2").toLowerCase()
}

/**
 * A simple global callback.
 */
function callback_global( item ) { return item }

/**
 * For creating Neqti methods. If last argument is true, uses camelize.
 * @param  @object    Body that holds/stores methods/more.
 * @param  @arguments Arguments/Array of object and methods.
 * @param  @boolean   Storing method camelize, dasherize or custom.
 * @return Extender.
 */
function extend( target, plugins, bool ) {
    var obj, prop, i, length, name, callback;

    //plugins should be iterable so an array.
    if ( length = plugins.length ) {
        //Plugins name default, camelize or dasherize..
        callback = is_boolean( bool ) ? ( bool ? camelize : dasherize ) : callback_global;
        
        //skip last argument
        for ( i = 0; i < length; i++ ) {
            if ( is_object( obj = plugins[ i ] ) ) {
                //The "_" in callback is for dasherize @param2
                for ( prop in obj ) {
                    name = callback( prop, "_" ),
                    //don't overwrite existing
                    !target[ name ] && ( target[ name ] = obj[ prop ] )
                }
            }
        }
    }

    return target
}

/**
 * @see extend();
 * Note that Neqti.fn.example = Neqti().extend({example:})
 */
fn.extend = function() {
    var target = this,
        argument = arguments;
    //when extending to Neqti or object.
    return extend( is_neqti( target ) ? fn : target, argument, argument[ argument.length - 1 ]  )
}


/**
 * Ready once document has loaded.
 * @param  @function Callback once document has loaded.
 * @return Neqti.
 */
fn.ready = function( callback ) {
    var callback_func = function() {
            return setTimeout( callback, 0, Neqti )
        };
    doc.readyState == "loading" ? doc.addEventListener( "DOMContentLoaded", callback_func ) : callback_func();
    return this;
}


/**
 * Matches css selector in an element
 * @param  The element to match.
 * @param  @string The selector/match to find.
 * @return True/False.
 */
function matches( element, selector ) {
    //stop if element is not really element
    if ( !selector || !is_element( element ) ) return false;
    
    //for different browser support
    var matches_selector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector;
    return matches_selector && matches_selector.call( element, selector )
}


/**
 * Type of comparator.
 * @param  Comparator can be function, string, Neqti, element.
 * @return Callback.
 */
function get_comparator( comparator ) {
    return is_function( comparator ) ? comparator :
    //Matches element by css selector
    is_string( comparator ) ? function( ele ) {
        return matches( ele, comparator )
    } :
    //Matches by Neqti
    is_neqti( comparator ) ? function( ele ) {
        return comparator.is( ele )
    } :
    //no comparator
    !comparator ? function() {
        return false
    } :
    //If element is comparator
    function( ele ) {
        return ele === comparator
    }
}


/**
 * For looping through iterable items. Can update iterable.
 * To break out of loop, return false in callback.
 * @param  @array @object - iterable items
 * @param  @function callback
 * @return Original Iterable.
 */
function each( iterable, callback ) {
    var key, i, l,
        //index is also key
        //destroy loop if callback is false
        callback_func = function( index ) {
            return callback.call( iterable[ index ], iterable[ index ], index ) === false
        };
    
    if ( is_array_like( iterable ) ) {
        for ( i = 0, l = iterable.length; i < l; i++ ) {
            if ( callback_func( i ) ) break;
        }
    } else {
        for ( key in iterable ) {
            if ( callback_func( key ) ) break;
        }
    }

    return iterable;
}

/**
 * @see each();
 */
fn.each = function( callback ) {
    return each( this, callback )
}


/**
 * Filter & Map. Works on array and object.
 * Cheat: works for strings since they're iterable
 * Map: stores the returned values
 * Filter: stores self value that passes a returned test/true
 * @param  @array @object Iterable items.
 * @param  @function Callback.
 * @param  @boolean True for filters.
 * @return Array|Object.
*/
function filter_map( iterable, callback, filter ) {
    var obj, each, key, i, l,
        callback_func = function( index ) {
            return callback.call( iterable[ index ], iterable[ index ], index, iterable )
        };
    
    if ( is_array_like( iterable ) ) {
        obj = [];
        //since it's not plain object, loop iterable's
        for ( i = 0, l = iterable.length; i < l; i++ ) {
            if ( each = callback_func( i ) )
                obj.push( !filter ? each : iterable[ i ] )
        }
    } else {
        //don't mind the name
        obj = {};
        //for plain object
        for ( key in iterable ) {
            if ( each = callback_func( key ) )
                obj[ key ] = !filter ? each : iterable[ key ]
        }
    }

    return obj
}

/**
 * Map out items.
 * @see filter_map();
 */
function map( iterable, callback ) {
    return filter_map( iterable, callback )
}

/**
 * Map out element(s) in collection.
 * @see filter_map();
 */
fn.map = function( callback ) {
    return Neqti( filter_map( this, callback ) )
}

/**
 * Filters items.
 * @see filter_map();
 */
function filter( iterable, callback ) {
    return filter_map( iterable, callback, true )
}

/**
 * Filters element(s) in collection.
 * @see    get_comparator();
 * @param  Selector for additional filtering.
 * @return Neqti.
 */
fn.filter = function( comparator ) {
    var compare = get_comparator( comparator );
    return Neqti( filter( this, function( ele, i ) {
        return compare.call( ele, ele, i )//boolean
    } ) )
}

/**
 * Filter_by uses comparator to filter element or returns collection.
 * @see    fn.filter();
 * @param  Neqti collection.
 * @param  Comparator to use.
 * @return Neqti|Filtered.
 */
function filter_by( collection, comparator ) {
    return !comparator ? collection : collection.filter( comparator )
}


/**
 * Grabs iterable items that has length.
 * @param @array Iterable items.
 * @param @function Callback.
 * @returns Array.
 */
function grab( iterable, callback ) {
    var value, i, array = [], length = iterable.length;
    for ( i = 0; i < length; i++ ) {
        if ( ( value = callback( iterable[ i ], i ) ) && value.length ) {
            //value is in array form
            push.apply( array, value )
        }
    }
    return array
}


//TODO: Coming Soon New...
function expand() {}


/**
 * Joins two or more arrays together using arguments.
 * //NEW: Internal use only.
 * @returns Array.
 */
function concat() {
    return grab( arguments, callback_global )
}


/**
 * Removes duplicate items thereby making them unique
 * @param  @array Iterable items. e.g Neqti collection.
 * @return Array.
 */
function unique( array ) {
    return array.length > 1 ? filter( array, function( item, index, self ) {
        //don't select duplicate item in array
        return indexOf.call( self, item ) === index;
    } ) : array
}


/**
 * Finds descendants of the element(s) in collection.
 * @param  @string The descendant to find.
 * @return Neqti.
 */
fn.find = function( selector ) {
    return Neqti( unique( grab( this, function( element ) {
        return find( selector, element )
    } ) ) )
}


/**
 * Slices items from a start to end. And if left undefined, slices out all item.
 * @param  @number Start slice.
 * @param  @number End slicing.
 * @return Neqti.
 */
fn.slice = function( start, end ) {
    return Neqti( slice.call( this, start, end ) )
}

/**
 * Works exactly like the default splice.
 * NOTE: If (@param2) isn't set, it uses position as amount of elements
 * to return.
 * example: elements.splice(4) will get 4 elements.
 * @see    grab();
 * @param  @number Position to start adding/removing.
 * @param  @number How many to remove after position.
 * @return Neqti.
 */
fn.splice = function() {
    var element, elements = this, args = arguments;
    if ( args.length ) {
        if ( args.length > 2 ) {
            args = grab( args, function( ele ) {
                element = Neqti( ele );
                return element.length ? element : [ ele ]
            } )
        }
        element  = null,
        elements = elements.get(),
        splice.apply( elements, args )
    }
    
    return Neqti( elements )
}


/**
 * Reduces elements to the ones that has descendant by selector or element.
 * Using lots of selector can slow page speed due to the loops.
 * @param  Selector.
 * @return Neqti.
 */
fn.has = function( selector ) {
    var comparator = is_string( selector ) ? function( element ) {
        //match descendant by selector
        return find( selector, element ).length
    } :
    ( selector = Neqti( selector ) ) && function( element ) {
        return some.call( selector, function( ele ) {
            //match descendant by element
            return element != ele && element.contains( ele )
        } )
    };

    return this.filter( comparator )
}


/**
 * Duplicate elements, including child nodes, text and attributes.
 * @param  {number} length Count of clones per element.
 * @return Neqti.
 */
fn.clone = function( length ) {
    //validate length
    length = is_numeric( length ) && ( length = parseInt( length ) ) > 1 ? length : 1;
    return Neqti( grab( this, function( ele ) {
        //returns array of clones
        return loop( length, function() { return ele.cloneNode( true ) }, true )
    } ) )
}

/**
 * Duplicate elements, including child nodes, text and attributes.
 * @param  {number}  length Count of clones per element.
 * @param  {boolean} bool   Whether to clone elements with events.
 * @return Neqti.
 */
fn.cloneWe = function( length, bool ) {
    var events, element;

    bool   = length === true || bool === true;
    length = is_numeric( length ) && ( length = parseInt( length ) ) > 1 ? length : 1;

    return Neqti( grab( this, function( ele ) {
        if ( bool ) events = Neqti( ele ).event();
        return loop( length, function() {
            element = ele.cloneNode( true );
            if ( bool ) element = Neqti( element ).events( events )[ 0 ];
            return element
        }, true )
    } ) )
}


/**
 * Returns first match by comparator in the collection.
 * @see    get_comparator();
 * @return Boolean.
 */
fn.is = function( comparator ) {
    var compare = get_comparator( comparator );
    //default [].some, stops immediately anyone is true.
    return some.call( this, function( ele, i ) {
        return compare.call( ele, ele, i )//boolean
    } )
}


/**
 * Gets elements that do not match the comparator.
 * Opposite of fn.filter()
 * @see    get_comparator()
 * @return Neqti.
 */
fn.not = function( comparator ) {
    var compare = get_comparator( comparator );
    return Neqti( filter( this, function( ele, i ) {
        return !compare.call( ele, ele, i )//boolean
    } ) )
}

//TODO Just writing it down here its for singleStatus stuff
//Make it buildable by object produced by PHP


/**
 * Add elements to collection.
 * fn.not() could be considered the opposite.
 * @see    Neqti();
 * @return Neqti.
 */
//TODO: Remove context from add()
fn.add = function( selector, context ) {
    return Neqti( unique( concat( this, Neqti( selector, context ) ) ) )
}


/**
 * Removes element from DOM and returns removed elements as new collection.
 * @see    filter_by();
 * @return Neqti.
 */
fn.pluck = function( comparator ) {
    return filter_by( this, comparator ).map( function( ele ) {
        if ( ele.parentNode ) return ele.parentNode.removeChild( ele )
    } )
}

/**
 * Removes elements from collection and DOM.
 * NOTE: Clone(s) can't be removed as it does not exist in DOM.
 * It also clears detached elements if any:(TODO, coming soon)
 * @see    fn.pluck()
 * @return Neqti.
 */
fn.remove = function( comparator ) {
    return this.not( this.pluck( comparator ) )
}


/**
 * Like fn.remove but can be reattached.
 * Can only detach element with parent.
 * @param  Comparator. Can also be used as second param.
 * @param  Namespace for detachted elements. Zero is the default.
 * @return Neqti.
 */
fn.detach = function( comparator, namespace ) {
    var parent;
    
    namespace = namespace || 0;
    //incase comparator is ID, copy and make comparator undefined
    if ( is_numeric( comparator ) ) namespace = comparator, comparator = undefined;
    
    //preserving elements that will be detached as an array
    detached_list[ namespace ] = map( filter_by( this, comparator ), function( ele ) {
        //save as object
        if ( parent = ele.parentNode )
            return { element: ele, index: Neqti( ele ).index(), parent: parent }
    } )
    
    //now remove elements
    return this.remove( comparator )
}

//detached preservation list
var detached_list = {};
Neqti.detached = detached_list;

/**
 * Gets the detached elements.
 * @param  Comparator. Can also be used as second param.
 * @param  Namespace for detachted elements. Zero is the default.
 * @return Array.
 */
function get_detached( comparator, namespace ) {
    var iterable, parent, children, length, element, index, compare;
    
    namespace = namespace || 0;
    //incase comparator is ID, copy and make comparator undefined
    if ( is_numeric( comparator ) ) namespace = comparator, comparator = undefined;

    if ( ( iterable = detached_list[ namespace ] || [] ).length ) {
        //clear detached_list
        detached_list[ namespace ] = [];

        //filter by comparator
        if ( comparator ) {
            compare = get_comparator( comparator );
            iterable = filter( iterable, function( item ) {
                //boolean
                return compare.call( item.element, item.element )
            } )
        }
    }
  
    /**
     * Quick Note: Sometimes this won't add back the element to the correct
     * index in the DOM even if the index is correct.
     * That's because the DOM must have been updated thereby making index inaccurate.
     */
    return map( iterable, function( item ) {
        element  = item.element,//element
        index    = item.index,//index
        parent   = Neqti( item.parent ),//parent
        children = parent.children(),//list of parent children
        length   = children.length;//length of parent children
        
        //ignore first and last index
        if ( length && ( length > index ) )
            children.eq( index ).before( element );
        else
            parent.append( element );//first and last index

        //push elements
        return element
    } )
}

/**
 * Attach elements that was detached.
 * The detached elements can be attached to new collection but will be placed back to it default parent DOM.
 * Please note once attached, the detached elements will be cleared(from detached_list)
 * @see    get_detached();
 * @return Neqti.
 */
fn.attach = function( comparator, namespace ) {
    return this.add( get_detached( comparator, namespace ) )
}


/**
 * Gets the next sibling element in DOM tree.
 * @param  Comparator.
 * @return Neqti.
 */
fn.next = function( comparator ) {
    return filter_by( Neqti( unique( map( this, function( ele ) {
        return ele.nextElementSibling
    } ) ) ), comparator )
}

/**
 * Gets the prev sibling element in DOM tree.
 * @param  Comparator.
 * @return Neqti.
 */
fn.prev = function( comparator ) {
    return filter_by( Neqti( unique( map( this, function( ele ) {
        return ele.previousElementSibling
    } ) ) ), comparator )
}

/**
 * Gets the direct parent of an element.
 * @param  Comparator.
 * @return Neqti.
 */
fn.parent = function( comparator ) {
    return filter_by( Neqti( unique( map( this, function( ele ) {
         return ele.parentNode
    } ) ) ), comparator )
}

/**
 * Returns all direct children of the elements.
 * @param  Comparator.
 * @return Neqti.
 */
fn.children = function( comparator ) {
    return filter_by( Neqti( unique( grab( this, function( ele ) {
        return ele.children
    } ) ) ), comparator )
}

//fn.hasChild

/**
 * Gets elements siblings except itself in collection.
 * @param  Comparator.
 * @return Neqti.
 */
fn.siblings = function( comparator ) {
    return filter_by( this.parent().children().not( this ), comparator )
}


/* START: Cash library */

function getValue( ele ) {
    //for selcting multiple options
    if ( ele.multiple && ele.options ) return map( ele.options, function( option ) {
        //don't select disabled option
        return option.selected && !option.disabled && !option.parentNode.disabled && getValue( option );
    } );
    
    return ele.value || "";
}

var queryEncodeSpaceRe = /%20/g,
    queryEncodeCRLFRe = /\r?\n/g,
    skippableRe = /file|reset|submit|button|image/i,
    checkableRe = /radio|checkbox/i;
    
function queryEncode(prop, value) {
    return "&" + encodeURIComponent(prop) + "=" + encodeURIComponent(value.replace(queryEncodeCRLFRe, "\r\n")).replace(queryEncodeSpaceRe, "+");
}

/**
 * Serialize form.
 */
fn.serialize = function() {
    var query = "", value, values;
    each( this, function( ele ) {
        /*each( ele.elements || [ele], function ( ele ) {*/
            //allow if checked
            if ( ele.disabled || !ele.name || ele.tagName === "FIELDSET" || skippableRe.test(ele.type) || checkableRe.test(ele.type) && !ele.checked ) return;
            
            if ( is_undefined( value = getValue( ele ) ) ) return;
            
            values = is_array( value ) ? value : [ value ];
            
            each( values, function( value ) {
                query += queryEncode(ele.name, value)
            } )
        /*} )*/
    });
    
    //removes "&" at the begginning
    return query.slice(1);
}

/**
 * Gets, adds and removes values.
 * @param  @string @array - The array is used for options & checkable html.
 * @return Neqti|String.
 */
fn.val = function( value ) {
    //get value
    if ( !arguments.length ) return this[ 0 ] && getValue( this[ 0 ] );
    
    return each( this, function ( ele ) {
        var is_multi_options = ele.multiple && ele.options;

        if ( is_multi_options || checkableRe.test(ele.type) ) {
            //Make sure values are string
            value = map( is_array( value ) ? value : [ value ], function( value ) {
                  return value.toString()
            } );
            
            if ( is_multi_options ) {
                each( ele.options, function ( option ) {
                    //deselect and select if option matches value
                    option.selected = value.indexOf(option.value) >= 0
                } )
            } else {
                //uncheck and check if values matches
                ele.checked = value.indexOf(ele.value) >= 0
          }
        }
        else
        //add or remove value
        ele.value = is_undefined( value ) || is_null( value ) ? "" : value
    } )
}
  
/* END: Cash library */


/**
 * Used to focus on input type field or anchor and more.
 */
fn.focus = function() {
    return is_element( this[ 0 ] ) && this[ 0 ].focus()
}


/**
 * Removing css property and value. Remove only if value is undefined/null and not zero.
 * @param  Neqti|Object.
 * @param  CSS property name.
 * @param  Removes only when has_value isn't set.
 * @return First Param|Undefined.
 */
function removeCssValue( element, property, has_value ) {
    if ( !has_value && has_value !== 0 ) {
        return each( element, function( ele ) {
            if ( is_element( ele ) )
                ele.style.removeProperty( dasherize( property ) )
        } )
    }
}

/**
 * Gets specific element css property value.
 * @param  Element.
 * @param  @string
 * @return String.
 */
function getCssValue( element, property ) {
    return element.style[ camelize( property ) ] || global.getComputedStyle( element, null ).getPropertyValue( dasherize( property ) );
}


/**
 * Adds and removes css property value.
 * Returns value if only property is supplied.
 * Can also add css using colon(:) default css style.
 * @param  @string @object The property name or object for multiple at once.
 * @param  Value for property. Null will remove css property & value.
 * @return Neqti.
 */
fn.css = function( property, value ) {
    var key, styles = "";
        
    if ( property ) {
        if ( arguments.length < 2 ) {
            //for multiple properties and values {}
            if ( is_plain_object( property ) ) {
                for ( key in property ) {
                    if ( !removeCssValue( this, key, property[ key ] ) )
                        styles += dasherize( key ) + ":" + property[ key ] + ";"
                }
            }
            else
            if ( is_string( property ) ) {
                //get css value
                if ( !(/.:./).test( property ) )
                    return is_element( this[ 0 ] ) && getCssValue( this[ 0 ], property ) || "";
                //if : was detected assume user is adding styles
                styles = property
            }
        }
        else
        if ( is_string( property ) ) {
            //for property and value, remove property if value is not specified
            //Also for adding styles, just property and the value
            if ( !removeCssValue( this, property, value ) )
                styles += dasherize( property ) + ":" + value + ";"
        }

        //no need for unnecessary callback, only run if styles is defined.
        if ( styles ) each( this, function( ele ) {
            if ( is_element( ele ) ) ele.style.cssText += ";" + styles
        } )
    }
    
    return this
}


/**
 * Attempts to parse value before getting.
 */
function get_data( element, key ) {
    return unstringify( element.dataset[ camelize( key ) ] )
}

/**
 * Attempts to stringify value before setting.
 */
function set_data( element, key, value ) {
    element.dataset[ camelize( key ) ] = stringify( value )
}

/**
 * Returns an object mapping all the data-* attributes to their values if no name
 * With a name, return the value of the data-* attribute.
 * With both a name and value, sets the value
 * To remove add name and value to null or undefined
 * Multiple data can be set using object
 * @param  @string @object The data name or object for multiple at once.
 * @param  @string
 * @return Neqti|Object.
 */
fn.data = function( name, value ) {
    var datas = {}, key;
    if ( !name ) {
        for ( key in this[ 0 ].dataset )
            datas[ key ] = get_data( this[ 0 ], key );
        return datas
    }
    else
    if ( is_string( name ) ) {
        //get
        if ( is_undefined( value ) )
            return is_element( this[ 0 ] ) && !is_undefined( value = get_data( this[ 0 ], name ) ) ? value : null;
        //remove
        if ( is_null( value ) )
            return this.removeAttr( "data-" + name );
        //set
        return each( this, function ( ele ) {
            if ( is_element( ele ) )
                set_data( ele, name, value )
        } )
    }
    else
    //set list
    if ( is_plain_object( name ) ) {
        for ( key in name )
            this.data( key, name[ key ] )
    }
  
    return this;
}


/**
 * Splits values by space
 * @param  @string
 * @return Array.
 */
function get_split_values( str ) {
    return is_string( str ) ? ( str.match(/\S+/g) || [] ) : [];
}

/**
 * Removes attributes from elements.
 * @param  @string Attribute name.
 * @return Neqti.
 */
fn.removeAttr = function( name ) {
    var attributes = get_split_values( name );
    return each( this, function( ele ) {
        if ( is_element( ele ) ) {
            each( attributes, function( name ) {
                ele.removeAttribute( name );
            } )
        }
    } )
}

/**
 * Sets or returns attribute values of the selected element.
 * It also removes specified attribute if @param2 is null
 * @param  @string @object The property name or object for multiple at once.
 * @param  @string @null
 * @return Neqti.
 */
fn.attr = function( name, value ) {
    if ( name ) {
        if ( is_string( name ) ) {
            //get attribute value for first element in collection.
            if ( is_undefined( value ) )
                return is_element( this[ 0 ] ) && !is_null( value = this[ 0 ].getAttribute( name ) ) ? value : null;

            //remove attribute if value is null
            if ( is_null( value ) )
                return this.removeAttr( name );
                
            //add attribute
            return each( this, function ( ele ) {
                if ( is_element( ele ) ) ele.setAttribute( name, value )
            } )
        }
        else
        //if name is plain object
        if ( is_plain_object( name ) ) {
            var key;
            for ( key in name ) {
                this.attr( key, name[ key ] )
            }
        }
    }
    
    return this
}


/**
 * Toggles between adding and removing one or more classes
 * force{true} adds, force{false} removes, force{undefined} toggles
 * @param  @string Classname list
 * @param  @boolean @undefined
 * @return Neqti.
 */
fn.toggleClass = function( classname, force ) {
    var classnames = get_split_values( classname ),
        is_force   = !is_undefined( force );
    return each( this, function( ele ) {
        if ( is_element( ele ) ) {
            each( classnames, function( name ) {
                //if force is defined
                if ( is_force ) {
                    //add or remove
                    force ? ele.classList.add( name ) : ele.classList.remove( name );
                } else {
                    //toggle
                    ele.classList.toggle( name );
                }
            } )
        }
    } )
}

/**
 * Adds classname to classlist.
 * @param  @string Classnames separated by space.
 * @return Neqti.
 */
fn.addClass = function( classname ) {
    return this.toggleClass( classname, true );
}

/**
 * Removes classnames from classlist. Leave emty to remove all classnames.
 * @param  @string Classnames separated by space.
 * @return Neqti.
 */
fn.removeClass = function( classname ) {
    //clear all, if classname is undefined
    if ( !classname ) return this.attr( "class", "" );
    return this.toggleClass( classname, false )
}

/**
 * Checks if any element has the specified classname. Stops and returns when true.
 * @param  @string Classname
 * @return True/False
 */
fn.hasClass = function( classname ) {
    return !!classname && some.call( this, function( ele ) {
        return is_element( ele ) && ele.classList.contains( classname );
    } )
}


/**
 * Check if element css display equals block.
 * @param  Element
 * @return True/False
 */
function is_visible( element ) {
    return getCssValue( element, "display" ) === "block"
}

/**
 * Toggle, hide and show in element.
 * @param  @boolean @undefined
 * @return Neqti.
 */
fn.toggle = function( force ) {
    var is_toggle = is_undefined( force );
    return each( this, function( ele ) {
        ( force || ( is_toggle && !is_visible( ele ) ) ) ? ele.style.display = "block" : ele.style.display = "none"
    } )
}

/**
 * @see fn.toggle();
 */
fn.show = function() {
    return this.toggle( true )
}

/**
 * @see fn.toggle();
 */
fn.hide = function() {
    return this.toggle( false )
}


/** START: insertElement */

/**
 * For append, prepend, before, after and more..
 * @param Anchor element.
 * @param Element.
 * @param True/False.
 * @param True/False.
 */
function insertElement( anchor, element, inside, before ) {
    // prepend/append/prependTo/appendTo
    if ( inside )
        anchor.insertBefore( element, before ? anchor.firstChild : null );
    else
    // before/after/insertBefore/insertAfter
    //silent errors here, so return if no parentNode
    if ( anchor.parentNode )
        anchor.parentNode.insertBefore( element, before ? anchor : anchor.nextSibling )
}

/**
 * @see    insertElement().
 * @param  Anchor elements acts like as parent for elements.
 * @param  Arguements of elements.
 * @param  True/False.
 * @param  True/False.
 * @param  True/False.
 * @return First Param.
 */
function insertSelectors( anchors, elements, inside, before, flip ) {
    var _ai, _anchor, _element;
    //merge all elements into 1 array collection.
    elements = unique( grab( elements, function( selector ) { return Neqti( selector ) } ) );
  
    each( elements, function( element, ei ) {
        each( anchors, function( anchor, ai ) {
            //reversal... avoid name conflict use _
            _anchor = flip ? element : anchor,
            _element = flip ? anchor : element,
            _ai = flip ? ei : ai;
            
            //clone when _ai > 0
            insertElement( _anchor, !_ai ? _element : _element.cloneNode( true ), inside, before )
        } )
    } )

    return anchors
}

/**
 * Appends element to collection.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.append = function() {
    return insertSelectors( this, arguments, true, false, false )
}

/**
 * Prepends element to collection.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.prepend = function() {
    return insertSelectors( this, arguments, true, true, false )
}

/**
 * Opposite of fn.append() FLIP.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.appendTo = function() {
    return insertSelectors( this, arguments, true, false, true )
}

/**
 * Opposite of fn.prepend() FLIP.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.prependTo = function() {
    return insertSelectors( this, arguments, true, true, true )
}

/**
 * Insert after an element in DOM.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.after = function() {
    return insertSelectors( this, arguments, false, false, false )
}

/**
 * Insert before an element in DOM.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.before = function() {
    return insertSelectors( this, arguments, false, true, false )
}

/**
 * Opposite of fn.after() FLIP.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.insertAfter = function() {
    return insertSelectors( this, arguments, false, false, true );
}

/**
 * Opposite of fn.before() FLIP.
 * @see    insertSelectors();
 * @return Neqti.
 */
fn.insertBefore = function() {
    return insertSelectors( this, arguments, false, true, true );
}

/** END: insertElement */


/** START: EventListener */

//store custom object for events
const EVENTS = [];
Neqti.events = EVENTS;

//eventname and namespace
function split_event_name( eventspace ) {
    return ( eventspace || "" ).split( "." )
}

/**
 * AddEventListener.
 */
function attach_event( target, event, handler, capturing ) {
    if ( target.addEventListener )
        target.addEventListener(event, handler, capturing);
    else
        target.attachEvent("on"+event, handler)
}

/**
 * RemoveEventListener.
 */
function detach_event( target, event, handler, capturing ) {
    if ( target.removeEventListener )
        target.removeEventListener(event, handler, capturing);
    else
        target.detachEvent("on"+event, handler)
}

/**
 * Record events and Add event listener to elements
 * @param The element.
 * @param Event.
 * @param Namespace(Optional).
 * @param @function the handler for the event.
 * @param @boolean @object - (Optional).
 */
function add_event_record( element, event, namespace, handler, capturing ) {
    var data, event_data;
    
    //get element object data
    data = EVENTS.find( function( obj ) {
        //check if element exist
        return obj.element === element
    } );
    
    //skips if element event data already exist
    if ( data == null ) {
        // empty: no inherited properties
        data = {};//Object.create(null);
        data.events = {};//Object.create(null);
        //store
        data.element = element;
        EVENTS.push( data );
    }
    
    //Don't create array for same eventName in same element, push to it instead
    if ( !data.events[ event ] ) data.events[ event ] = [];
    
    //This helps to prevent duplicates by limiting same function in same eventname in an element
    //this stops same eventname from having duplicate(same handler)
    if ( data.events[ event ].find( function( obj ) { return obj.handler === handler } ) ) return;
    
    event_data = {};//Object.create(null);
    event_data.namespace = namespace;
    event_data.handler = handler;
    event_data.capturing = capturing;
    //event_data.selector = selector;
    //event_data.delegated = typeof selector === 'string';
    //push event_data by eventName
    data.events[ event ].push( event_data );

    // Add
    attach_event( element, event, handler, capturing )
}

/**
 * Add event listener to elements
 * @param The element.
 * @param Event + Namespace(Optional).
 * @param {function} The handler for the event.
 * @param {boolean|object} (Optional).
 */
function add_event( elements, eventspace, handler, capturing ) {
    eventspace = split_event_name( eventspace );
    //get event and namespace
    var event     = eventspace[ 0 ],
        namespace = eventspace[ 1 ],
        i,
        length;
        
    if ( is_string( event ) && is_function( handler ) ) {
        if ( !is_boolean( capturing ) && !is_plain_object( capturing ) ) capturing = false;
        
        //should be loopable
        elements = elements.length ? elements : is_element( elements ) ? [ elements ] : Neqti();

        for ( i = 0, length = elements.length; i < length; i++ )
            add_event_record( elements[ i ], event, namespace, handler, capturing );
    }
}

/**
 * Gets or Removes recorded events and event listener from elements.
 * @param  The element.
 * @param  Event.
 * @param  Namespace(Optional).
 * @param  @function The handler for the event.
 * @param  @boolean True for getting event records.
 * @return Object. Only if fifth param is true.
 */
function event_records( element, event, namespace, handler, get_events ) {
    var data, events, event_data, test_event, recorded_event = {};
    
    //get element object data
    data = EVENTS.find( function( obj ) {
        //check if element exist
        return obj.element === element
    } );
    
    //stop if element doesnt exist in record
    if ( data == null ) return;
    
    //get event name
    events = event ? [ event ] : keys( data.events );
    
    test_event = function( event ) {
        //remove events that is true
        return ( !namespace && !handler ) || ( handler === event.handler && namespace === event.namespace ) || ( namespace === event.namespace && !handler ) || ( handler === event.handler && !namespace )
    };
    
    each( events, function( type ) {
        event_data = data.events[ type ];

        // For events with values only
        if ( !event_data || !event_data.length ) return;
        
        //Remove: filtered are the events that didn't match for (remove)
        //Get: filtered are the ones that matched
        recorded_event[ type ] = filter( event_data, function( event ) {
            return test_event( event ) ?
                ( !get_events ? detach_event( element, type, event.handler, event.capturing ) : true )
                : !get_events//resave events if remover test fails
        } )
        
        //FIXED: events being removed when getting events
        //only do this for eventlistener remover
        if ( !get_events ) data.events[ type ] = recorded_event[ type ]
    })
  
    if ( get_events ) return recorded_event
}

/**
 * @see event_records();
 */
function from_event( elements, eventspace, handler, get_events ) {
    //incase we're removing events by function
    if ( is_function( eventspace ) ) handler = eventspace, eventspace = undefined;
        
    eventspace = split_event_name( eventspace );
    //get event and namespace
    var event     = eventspace[ 0 ],
        namespace = eventspace[ 1 ],
        i,
        length,
        result,
        event_results = [];
        
    //should be loopable
    elements = elements.length ? elements : is_element( elements ) ? [ elements ] : Neqti();
    
    for ( i = 0, length = elements.length; i < length; i++ ) {
        result = event_records( elements[ i ], event, namespace, handler, get_events );

        if ( get_events && result && keys( result ).length )
            event_results.push( {element: elements[ i ], events: result} )
    }
  
    //#NEW
    //for getting list of events
    if ( get_events ) return event_results
}

/**
 * Remove event listener from elements
 * @param The element.
 * @param Event + namespace(Optional).
 * @param @function The handler for the event.
 */
function remove_event( elements, eventspace, handler ) {
    from_event( elements, eventspace, handler )
}

/**
 * Eventlistener.
 * @lastparam True for adding event.
 */
function event_listener( elements, eventspace, handler, capturing, add ) {
    //NEW: add/remove multiple event by giving space between events name..
    if ( is_string( eventspace ) ) {
        each( get_split_values( eventspace ), function( event ) {
            add ? add_event( elements, event, handler, capturing ) : remove_event( elements, event, handler )
        } )
    }
    else
    //event remover fallback: eventspace might be function
    if ( !add ) remove_event( elements, eventspace, handler );
    
    return elements
}

/**
 * Add event listener
 * @param  Event name + namespace(Optional).
 * @param  @function Handler.
 * @param  True/False.
 * @return Neqti.
 */
fn.on = function( event, handler, capturing ) {
    return event_listener( this, event, handler, capturing, true )
}

/**
 * Remove event listener
 * Leave both param empty to remove all events.
 * You can remove event using function attached.
 * @param  Event name + Namespace(Optional) or Handler.
 * @param  @function The handler(Optional).
 * @return Neqti.
 */
fn.off = function( event, handler ) {
    return event_listener( this, event, handler )
}

/**
 * For adding events using object.
 * @param {element} element
 * @param {object}  events
 */
function add_event_object( element, events ) {
    each( events, function( event, eventname ) {
        each( event, function( e ) {
            if ( e.handler ) add_event_record( element, eventname, e.namespace, e.handler, e.capturing )
        } )
    } )
}

/**
 * For getting and setting events using valid events object.
 * 
 * Events can be retrieved by eventname or handler and both params when
 * empty will get all events.
 * Tip: Use Neqti readyState to get events added after fn.events
 * @param  eventspace Eventname + namespace(Optional) or Handler.
 * @param  {function} handler Optional.
 * @return Array|Neqti.
 */
fn.events = function( eventspace, handler ) {
    var self = this, key_name, key_result, event_results, NODES = [];

    /**
     * Registers events to element if (eventspace) is plain object.
     * This method adds supplied event object to an element NODES[event list].
     * The handler is evaluated as {function} is needed for triggering events,
     * object without an handler in it won't be added.
     */
    if ( is_plain_object( eventspace ) )
        return each( self, function( element ) { add_event_object( element, eventspace ) } );

    //Get events
    if ( self.length ) {
        //get specified events
        if ( is_string( eventspace ) ) {
            //incase theres multiple event.namespace
            each( get_split_values( eventspace ), function( event ) {
                each( from_event( self, event, handler, true ), function( data ) {
                    //checking if element is already in NODE.
                    event_results = NODES.find( function( obj ) {
                        return obj.element === data.element
                    } )
                    
                    //element doesn't exist, register.
                    if ( !event_results ) return NODES.push( data );
                    
                    //element exists, merge only new eventname.
                    key_name = keys( key_result = data.events )[ 0 ];
                    //add new event name.
                    event_results.events[ key_name ] = key_result[ key_name ]
                } )
            } )
        } else {
            //get all events
            NODES = from_event( self, eventspace, handler, true )
        }
    }
    
    return NODES
}

/**
 * If eventspace isn't an object, it's getting events not setting.
 * @see    fn.events();
 * @return Neqti|Object.
 */
fn.event = function( eventspace, handler ) {
    var event = this.eq( 0 ).events( eventspace, handler );

    // Open up events when getting
    if ( ! is_plain_object( eventspace ) )
        event = ( event[ 0 ] || {} ).events || {};

    return event;
}

/**
 * Event checker.
 * @see    fn.events();
 * @return True/False.
 */
fn.hasEvent = function( eventspace, handler ) {
    return !!this.events( eventspace, handler ).length
}

/**
 * Click listener. It also handles multiple clicks type.
 * 
 * @see    fn.on();
 * 
 * @param  @function
 * @param  @boolean @number
 * @param  @number
 * 
 * 
 * Additional features.
 * 
 * It also use element self click if no argument was applied.
 * 
 * For doubleclick  - click( function, 2, timeout( optional ) )
 * For trippleclick - click( function, 3, timeout( optional ) )
 * TODO:
 * For timeoutclick - click( function, null, timeout( required ) )
 * 
 * @return Neqti.
 */
fn.click = function( handler, capturing, timeout ) {
    //self click
    if ( !arguments.length ) return each( this, function() { this.click() } );
  
    //default onclick
    if ( ( !capturing && !timeout ) || is_boolean( capturing ) ) return this.on( "click", handler, capturing );
    
    //default is 2 clicks
    var length = 2, is_timeout = is_numeric( timeout );
    
    //clicks count
    //TODO: || ( is_null( capturing ) && is_timeout )
    if ( is_numeric( capturing )  ) length = capturing;
    
    //timeout
    timeout = is_timeout ? parseInt( timeout ) : length * 200;

    each( this, function( ele ) {
        //per element so it won't be overwriten
        var tap_count = 0,
            self;
            
        Neqti( ele ).on( "click", function( event ) {
            self = this;
            tap_count++;
            
            setTimeout( function(){
                //do if length equals tap_count after timeout
                if ( tap_count === length ) handler.call( self, event, tap_count );
                //reset count
                tap_count = 0
            }, timeout )
        } )
    } )
    
    return this
}

/**
 * @see fn.click();
 */
fn.doubleclick = function( handler, timeout ) {
    return this.click( handler, 2, timeout )
}
  
/**
 * @see fn.click();
 */
fn.tripleclick = function( handler, timeout ) {
    return this.click( handler, 3, timeout )
}

/** END: EventListener */


/**
 * Empty HTML element.
 * @return Neqti.
 */
fn.empty = function() {
    return each( this, function( ele ) {
        if ( is_element( ele ) ) ele.innerHTML = ""
    } )
}

/**
 * Returns all direct childNodes of each element.
 * Can also get contents of an Iframe using contentDocument.
 * @return Neqti.
 */
fn.contents = function() {
    return Neqti( unique( grab( this, function( ele ) {
        if ( is_element( ele ) ) return ele.contentDocument || slice.call( ele.childNodes )
    } ) ) )
}

/**
 * Sets/Gets the html for an element.
 * @param  Content text to add or null return html string or undefined
 * for content text.
 * @return Neqti|String.
 */
fn.html = function( html ) {
    // undefined == null non-strictly
    if ( html == null ) return this[ 0 ] && ( is_null( html ) ? this[ 0 ].outerHTML : this[ 0 ].innerHTML );
    return each( this, function( ele ) {
        if ( is_element( ele ) ) ele.innerHTML = html;
    } )
}

/**
 * Adds or gets text of the first element.
 * @param1  @string Text
 * @param2  @boolean Means addon to old/default text.
 * @return  @string (@neqti collection)
 */
fn.text = function( text, addon ) {
    if ( is_undefined( text ) ) return this[ 0 ] ? this[ 0 ].textContent : "";
    return each( this, function( ele ) {
        if ( is_element( ele ) )
            ele.textContent = !addon ? text : ele.textContent + text;
    } )
}

/**
 * Gets index of an element in it parent.
 * Note: it gets the index of first element in collection.
 * @param  Selector/comparator
 * @return Number.
 */
fn.index = function( selector ) {
    var element = filter_by( this, selector )[ 0 ],
        collection = element ? Neqti( element ).parent().children() : [];
    return indexOf.call( collection, element )
}

/**
 * Gets item in array by index. If no index is specified gets all item in array.
 * @param  @number @array To select multiple use array and the indeces.
 * @return Array.
 */
fn.get = function( index ) {
    var self = this;
    
    if ( is_undefined( index ) ) return slice.call( self );
    
    //Make index iterable
    index = is_array( index ) ? index : [ index ];
    return map( unique( index ), function( by ) {
        //can use negative indeces too
        return self[by < 0 ? ( by + self.length ) : by]
    } )
}

/**
 * @see    fn.get();
 * @param  @number @array
 * @retrun Neqti.
 */
fn.eq = function( index ) {
    return Neqti( this.get( index ) );
}

/**
 * @see fn.eq();
 */
fn.first = function() { return this.eq( 0 ) }

/**
 * @see fn.eq();
 */
fn.last = function() { return this.eq( -1 ) }

/**
 * Gets middle element in collection.
 * If element in collection is even, gets both.
 * @see    fn.eq();
 * @return Neqti.
 */
fn.middle = function() {
    var length = this.length,
        divided = Math.floor( length / 2 );
    return this.eq( !( length % 2 ) ? [ divided - 1, divided ] : divided )
}


/**
 * Strictly get the type of value.
 * @param  Value to get the typeof.
 * @return String.
 */
var class2type = {},
    toString   = emptyObject.toString;
function type( value ) {
    if ( value == null ) return value + "";

    if ( !class2type[ "[object Object]" ] ) {
        var names  = "String Number Boolean Function Null Undefined Array Object RegExp Date Error".split( " " ),
            length = names.length,
            i;
        for ( i = 0; i < length; i++ ) {
            class2type[ "[object " + names[ i ] + "]" ] = names[ i ].toLowerCase()
        }
    }
    
    return class2type[ toString.call( value ) ] || "object"
}


/**
 * Shuffles iterable items that has length. Number shuffle compatibility added.
 * @param  @array @string @number
 * @return Depending on param.
 */
function shuffle( iterable ) {
    var rand,
        split,
        length,
        is_number;

    if ( iterable ) {
        //split string and number type
        if ( is_string( iterable ) || ( is_number = is_numeric( iterable ) ) ) {
            split    = true,
            iterable = iterable.toString().split( "" )
        }

        if ( ( length = iterable.length ) && length > 1 ) {
            each( iterable, function( item, i ) {
                rand             = Math.floor( Math.random() * length ),
                iterable[ i ]    = iterable[ rand ],
                iterable[ rand ] = item
            } )
        }

        //convert back
        if ( split ) iterable = iterable.join( "" )
    }

    return is_number ? parseInt( iterable ) : iterable
}

/**
 * @see    shuffle();
 * @return Neqti.
 */
fn.shuffle = function(){
    return shuffle( this )
}



/**
 * 
 * @param {int} number 
 * @param {function} callback 
 * @param {bool} __return 
 * @returns Array
 */
/**
 * For custom loop using length.
 * @param  @number Loop count.
 * @param  @function Callback.
 * @param  True to return mapped values as an array list.
 * @return Callback returned value.
 */
function loop( number, callback, map ) {
    var obj = [], item, index;
    if ( is_numeric( number ) && ( number = parseInt( number ) ) ) {
        for ( index = 0; index < number; index++ ) ( item = callback( index ) ), ( map && ( obj[ index ] = item ) );
    }
    return obj;
}


/**
 * Same as Object.keys, it gets objects key names.
 * @param  @object The object to find keys from.
 * @param  True to make keys unique.
 * @return Array.
 */
function keys( object, unique  ) {
    object = Object.keys( object );
    //incase it should be unique
    return unique === true ? unique( object ) : object;
}



/**
 * Attempts function without failing.
 * @param   {function} func 
 * @param   {*} argument 
 * @returns mixed
 */
function attempt( func, argument ) {
    try {
      return func( argument )
    } catch (_a) {
      return argument
    }
}


/**
 * Tries to convert stringified value back to it typeof value.
 * @param   {*} value 
 * @returns mixed
 */
function unstringify( value ) {
    return attempt( JSON.parse, value )
}

/**
 * Converts to valid JSON value which is always a string.
 * @param   {*} value
 * @returns mixed
 */
function stringify( value ) {
    return is_object( value ) ? attempt( JSON.stringify, value ) : ( "" + value )
}

/**
 * Cookies function.
 */
function cookie( name, value ) {
    if ( is_string( name ) ) {
        if ( is_null( value ) )
            return doc.cookie = build( name )
    }
}

//TODO
function hash( string, base, useAt ) {
    var list = [];
    each( string.split( "" ), function( letter, i ) {
        //convert each string charCode to base: default is 16
        list[ i ] = string.charCodeAt( i ).toString( base || 16 );
        
        if ( useAt === true && base === 2 ) list[ i ] = list[ i ].replace( /0/g, "-@-").replace( /1/g, "@" );
        
        //console.log(string.charCodeAt(i))
    } )
    
    return list
}
//TODO
function unhash( array, base ) {
    var list = '', new_array = [];
    
    each( array, function( item, i ) {
        //use new array so as not to change old array
        //change (-@- & @) to (0 & 1)
        new_array[ i ] = item.replace( /-@-/g, "0" ).replace( /@/g, "1" )
    } )
    
    //convert back to string
    each( new_array, function( item, i ) {
        //use the base used to convert to get correct char
        list += String.fromCharCode( parseInt( item, base || 16 ) )
    } )

    return list
}


/**
 * Set, Get, Remove or Clear items. Uses localStorage or sessionStorage.
 * @param  Name of item or null to clear all items or leave empty/undefined to get all items and value.
 * @param  For setting item value, if left empty it gets item value. Use null to remove an item.
 * @param  Type of storage to use, default is localStorage. use false for sessionStorage storage.
 * @return Mixed.
 */
function storage( name, value, type ) {
    var i, key, length, items = {};
    
    type = type || localStorage;
    
    if ( !name ) {
        //remove all items
        if ( is_null( name ) ) return type.clear();
        
        //get all items
        for ( i = 0, length = type.length; i < length; ++i ) {
            if ( key = type.key( i ) )
                items[ key ] = storage( key, value, type )
        }
        
        return items
    }
    
    if ( is_string( name ) ) {
        //remove item...
        if ( is_null( value ) )
            return type.removeItem( name );
        
        //get item...
        if ( is_undefined( value ) )
            return unstringify( type.getItem( name ) );
        
        //set item... Tries stringified
        return type.setItem( name, stringify( value ) )
    }
    
    if ( is_plain_object( name ) ) {
        //set/remove multiple items
        for ( key in name )
            storage( key, name[ key ], type )
    }
    
}

/**
 * For session storage.
 * @param {string} name 
 * @param {mixed}  value 
 * @returns 
 */
function storageX( name, value ) {
    return storage( name, value, sessionStorage )
}


/**
 * Used to change/update literals in a string by object key name.
 * {{username}}    = {username : "The Name"}
 * {{username()}}  = {username : function(){}}
 * {{user:status}} = {user : {status : "away"}}
 * 
 * NOTE: Undefined object works with global variables. Meaning any var
 * declared inside a scope is not and global and the literal won't be
 * able to do anything as the variable doesn't exist.
 * 
 * NEW**
 * NOTE: When changing literals of html and an html is called and,
 * Javascript looses whatever hold it has on that element until it
 * is recalled.
 * 
 * @param {string|element} Where literals would be.
 * @param {object}         Optional. The object to get literal values
 *                         from, uses window object when left empty.
 * @param {function}       Optional. Custom callback action in output.
 * @returns Updated string.
 */
function literals( string, object, callback ) {
    var output, literals, callable, length, namespace, element;

    /**
     * NEW:
     * Now the (string) param can be an element. Uses it text for literals
     * and text replacement.
     */
    if ( is_element( string ) ) element = Neqti( string ), string = element.html();

    /**
     * (?:(?<!\{)\:)?  matches ':' if not followed by '{'...
     * [a-z]+          matches the name of object or function...
     * (?:\(\)(?=\}))? matches () only if followed by '}'...
     * (?:regex)+      matches this regex multiple times...
     * \{\{regex\}\}   matches regex beginning and end...
     */
    //literals = string.match(/\{\{(?:(?:(?<!\{)\:)?[a-z]+(?:\(\)(?=\}))?)+\}\}/g);
    //TODO: New update supports number if followed by :, meaning {{1}} won't work.
    literals = string.match(/\{\{(?:(?:(?<!\{)\:)?(?:[a-z]+(?:\(\)(?=\}))?|[0-9]+(?=\:)))+\}\}/g);

    //incase object is a function.
    if ( is_function( object ) ) callback = object, object = undefined;

    //uses global variables/datas to update literals.
    if ( is_undefined( object ) ) object = global;
    
    if ( literals && is_object( object ) ) {
        each( unique( literals ), function( literal ) {
            //light copy object
            output    = object;
            //literal object hierarchy values
            callable  = /\(\)/.test( literal ),
            //added support for number. Old: literal.match(/[a-z]+/g)
            namespace = literal.match(/[a-z-0-9]+/g),
            length    = namespace.length - 1;//index starts from 0
            each( namespace, function( value, index ) {
                //Gets output by object hierachy using literal
                output = output[ value ];

                //By Neqti rule, only last literal name is callable
                if ( callable && length === index )
                    output = ( is_function( output ) ? output() : undefined );

                /**
                 * Fallback for literals that couldn't be converted, non-callable literals
                 * that are callable and callable literals that are non-callable.
                 * 
                 * Neqti literal rule is that {{literal}} shouldn't be callable and{{literal()}}
                 * must be callable. This rule helps in making a better literal customization
                 * and coding standard.
                 */
                if ( is_undefined( output ) || is_function( output ) ) {
                    output = literal;
                    return false//break loop
                }
            } )
            
            if ( output != literal ) {
                //changing literals data by callback.
                if ( callback ) output = callback( output );

                //escape parentheses
                literal = literal.replace(/[()]/g, "\\$&");

                //replace literal to output(object value)
                string = string.replace( regex( literal, "g" ), output )
            }
        } )

        //replace literals in an element
        if ( element ) element.html( string )
    }
    
    return string
}

/**
 * Shortcut to RegExp.
 */
function regex( literal, flag ) {
    return new RegExp(literal, flag)
}

/**
 * Same as literals().
 * @uses   fn.html();
 * @param  {object} object To get literal values from
 * @return Neqti.
 */
fn.literals = function( object, callback ) {
    return each( this, function( ele ) { literals( ele, object, callback ) } )
}


/**
 * Load and extend specific function to an object target.
 * The exact name is used as caller if bool isn't a boolean.
 * e.g is_window and isWindow are the same.
 * 
 * @param {array|string} options   Now supports string separated by space.
 * @param {boolean|undefined} bool True is camelized, false is dasherized and
 *                                 undefined uses caller.
 * @param {object} target          The object to extend to.
 * 
 * NEW: No longer returns the target object.
 */
//remove before minification
function plugins( options, bool, target ) {
    var camel, data, slot = {}, objects = {},
        unplug = ["detached", "events", "extend", "fn", "plugins"];

    // Makes param( bool ) accept  param( target ).
    if ( is_object( bool ) && !is_object( target ) ) target = bool, bool = null;
    
    // When using strings as caller
    if ( options && is_string( options ) ) options = options.split( " " );

    if ( is_object( options ) ) {
        //select specific to load
        if ( options.length ) {
            each( options, function( name ) {
                camel = camelize( name );
                //allowed pluggables only
                if ( unplug.indexOf( camel ) < 0 ) {
                    /**
                     * Check by specified name, camelized or dasherized.
                     * Normally all Neqti's global functions are camelized.
                     * But users might hook to Neqti's global function using
                     * dasherize, so this is just a precaution for catching all
                     * style of naming convention.
                     * Note: The specified name is used for extending functions,
                     * unless the second param of plugins() uses boolean to set all
                     * to either camelCase or dashed_case.
                     */
                    data = Neqti[ name ] || Neqti[ camel ] || Neqti[ dasherize( name, "_" ) ];
                    
                    //stops same processing duplicates
                    if ( data && !slot[ camel ] ) slot[ camel ] = 1, objects[ name ] = data;
                }
            } )
        }

        extend( target || global, [ objects ], bool )
    }
}


//TODO encoding special chars
//"₦he lloBe12.د.ب".replace(/[\u00A0-\u9999<>\&]/gi, i => '&#'+i.charCodeAt(0)+';')

//TODO: making custom apply
/** 
Neqti.fn.apply = function( array ) {
    var self = this[0];
    each( array, function( value ) {
        self = self[value]
    } )

    return self
}
//console.log(Neqti("<div>", {style:"display:flex"}).apply(["style", "display"]));
*/


//TODO loading object by level, eg level:level2:level3
/* 
function loadApp( name, data ) {
    if ( isPlainObject( data ) ) {
        name = name.split( ":" );
        var globe = $.gX;

        each( name, function( key, i ) {
            if ( name.length !== (i + 1) && ! globe[key]) {
                globe = globe[key]return false;

            if ( name.length === i + 1 ) console.log(key)
        } )
        //$.gX[ name ] = data
    }
}*/
//TODO
function sprintf() {
    //%d %s %f %b
}


//Neqti global
Neqti.plugins = plugins,
Neqti.extend  = fn.extend,
Neqti.isNeqti = is_neqti,

Neqti.isNull        = is_null,
Neqti.isArray       = is_array,
Neqti.isString      = is_string,
Neqti.isWindow      = is_window,
Neqti.isObject      = is_object,
Neqti.isNumeric     = is_numeric,
Neqti.isBoolean     = is_boolean,
Neqti.isElement     = is_element,
Neqti.isDocument    = is_document,
Neqti.isFunction    = is_function,
Neqti.isUndefined   = is_undefined,
Neqti.isArrayLike   = is_array_like,
Neqti.isPlainObject = is_plain_object,

Neqti.fn  = fn,
Neqti.map = map,
Neqti.each = each,
Neqti.grab = grab,
Neqti.loop = loop,
Neqti.keys = keys,
Neqti.filter = filter,
Neqti.concat = concat,
Neqti.unique = unique,

Neqti.type = type,
Neqti.shuffle = shuffle,
Neqti.storage = storage,
Neqti.storageX = storageX,
Neqti.literals = literals,
Neqti.camelize = camelize,
Neqti.dasherize = dasherize,
Neqti.parseHTML = parse_html,
Neqti.parseJSON = unstringify;
Neqti.stringify = stringify;

//Neqti global end

//before minifying remove comment from below
//so the above will be minified the way i want..
  /*Neqti.extend({
    isNeqti : is_neqti,
    extend : fn.extend
  },
  {
    isNull : is_null,
    isArray  : is_array,
    isString : is_string,
    isWindow : is_window,
    isObject : is_object,
    isNumeric : is_numeric,
    isBoolean : is_boolean,
    isElement : is_element,
    isDocument : is_document,
    isFunction : is_function,
    isUndefined : is_undefined,
    isArrayLike : is_array_like,
    isPlainObject : is_plain_object
  })
  
  Neqti.extend({
    fn  : fn,
    map : map,
    each : each,
    grab : grab,
    loop : loop,
    keys : keys,
    filter : filter,
    concat : concat,
    unique : unique,

    type : type,
    shuffle : shuffle,
    storage : storage,
    storageX : storageX,
    literals : literals,

    camelize : camelize,
    dasherize : dasherize,
    
    parseHTML : parse_html,
    parseJSON : unstringify,
    stringify : stringify
  })*/
  
  
global.Neqti = Neqti
})( window || this );