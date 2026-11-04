export class History {
  constructor(initialValue, limit = 30) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('历史上限无效');
    this.limit=limit; this.items=[initialValue]; this.index=0;
  }
  get current(){return this.items[this.index]}
  get canUndo(){return this.index>0}
  get canRedo(){return this.index<this.items.length-1}
  push(value){this.items=this.items.slice(0,this.index+1);this.items.push(value);if(this.items.length>this.limit+1)this.items.shift();this.index=this.items.length-1;return this.current}
  undo(){if(this.canUndo)this.index--;return this.current}
  redo(){if(this.canRedo)this.index++;return this.current}
  reset(value){this.items=[value];this.index=0;return this.current}
}
