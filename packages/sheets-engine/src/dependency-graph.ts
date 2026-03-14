export class DependencyGraph {
  private deps = new Map<string, Set<string>>(); // cell -> cells it depends on
  private rdeps = new Map<string, Set<string>>(); // cell -> cells that depend on it

  addDependency(cell: string, dependsOn: string): void {
    if (!this.deps.has(cell)) this.deps.set(cell, new Set());
    this.deps.get(cell)!.add(dependsOn);
    if (!this.rdeps.has(dependsOn)) this.rdeps.set(dependsOn, new Set());
    this.rdeps.get(dependsOn)!.add(cell);
  }

  removeDependencies(cell: string): void {
    const old = this.deps.get(cell);
    if (old) {
      for (const dep of old) {
        this.rdeps.get(dep)?.delete(cell);
      }
      this.deps.delete(cell);
    }
  }

  getDependents(cell: string): string[] {
    return [...(this.rdeps.get(cell) ?? [])];
  }

  /** Topological order of all cells that need recalculation starting from `changed` */
  getRecalcOrder(changed: string): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (c: string) => {
      if (visited.has(c)) return;
      visited.add(c);
      for (const dep of this.getDependents(c)) {
        visit(dep);
      }
      order.push(c);
    };

    for (const dep of this.getDependents(changed)) {
      visit(dep);
    }

    return order.reverse();
  }

  hasCircularDependency(cell: string): boolean {
    const visited = new Set<string>();
    const check = (c: string): boolean => {
      if (c === cell) return true;
      if (visited.has(c)) return false;
      visited.add(c);
      for (const dep of this.getDependents(c)) {
        if (check(dep)) return true;
      }
      return false;
    };
    return this.getDependents(cell).some((dep) => check(dep));
  }
}
