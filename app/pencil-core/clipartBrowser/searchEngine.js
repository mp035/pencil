
function SearchEngine() {
    this.title = null;
    this.name = null;
    this.icon = null;
    this.description = null;
    this.uri = null;
}

SearchEngine.prototype.search = function(query, options, onComplete, onError) {
    return this.searchImpl(query, options, onComplete, onError);
}
