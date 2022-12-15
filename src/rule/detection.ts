import {
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from "class-validator";
import { ObjectLiteral } from "../types/object-literal";
import { ArrayUtils } from "../utils/array-utils";
import { Identifier } from "./identifier";

enum Quantifier {
  Any = "any",
  All = "all",
}

enum QuantifierTarget {
  Them = "them",
}

export class Detection {
  [key: string]: any;

  @IsString()
  @IsNotEmpty()
  public condition: string;

  @IsString()
  @IsOptional()
  public timeframe?: string;

  public getConditionNames(): string[] {
    return Object.getOwnPropertyNames(this).filter(
      (key) => ["condition", "timeframe"].includes(key) === false
    );
  }

  public getConditionByName(name: string): any {
    return (this as any)[name];
  }

  public expandCondition(): string {
    this.validate();

    let conditionExpression = this.condition;

    const reStatement = /(\w+)\s+of\s+([\w.*]+)/;

    if (reStatement.test(conditionExpression) === false) {
      // No need to expand
      return conditionExpression;
    }

    // We will create a new RegExp with global modifier so that
    const matches = conditionExpression.match(new RegExp(reStatement, "g"));

    for (let i in matches) {
      const statement: string = matches[i];

      const [_, quantifier, targetGroup] = reStatement.exec(statement);

      const expandedStatement = this.expandStatement(quantifier, targetGroup);

      conditionExpression = conditionExpression.replace(
        statement,
        expandedStatement
      );
    }

    return conditionExpression;
  }

  public validate(): void {
    const errors = validateSync(this);

    if (errors.length > 0) {
      throw new Error(`Detection object validation failed: ${errors}`);
    }

    const conditionNames = this.getConditionNames();

    if (conditionNames.length === 0) {
      throw new Error(
        "Detection section should contain at least one condition"
      );
    }

    for (let i in conditionNames) {
      const name = conditionNames[i];

      const condition = this.getConditionByName(name);

      if (!condition) {
        throw new Error(`Condition:${name} is either null or empty`);
      }
    }
  }

  /**
   * Resolves condition names using the provided condition targetGroup or natural language identifier
   * @param targetGroup: Name of the condition group or a wildcards pattern
   *
   * Example:
   * them, selection, selection*
   */
  private resolveConditionNames(targetGroup: string): string[] {
    let conditions: string[];

    if (targetGroup === QuantifierTarget.Them) {
      conditions = this.getConditionNames();
    } else if (targetGroup.indexOf("*") >= 0) {
      // selection* => selection1, selection2 and so on.
      const re = new RegExp(targetGroup);

      conditions = this.getConditionNames().filter((c: string) => re.test(c));
    } else {
      const parent = (this as ObjectLiteral)[targetGroup];

      if (parent === undefined) {
        throw new Error(
          `Rule doesn't contain a condition named ${targetGroup}`
        );
      }

      //
      // We should get children of this group as parent.condition format
      //

      conditions = Object.getOwnPropertyNames(parent).map(
        (c: string) => `${targetGroup}.${c}`
      );
    }

    return conditions;
  }

  /**
   * Expands natural language statements such as:
   * 1 of them, any of them, all of them, 3 of condition*
   * @param quantifier: 1, any, all and etc.
   * @param targetGroup: them, selection or a wildcards pattern (selection*)
   */
  private expandStatement(quantifier: string, targetGroup: string): string {
    const conditions = this.resolveConditionNames(targetGroup);

    switch (quantifier) {
      case Quantifier.All:
        return conditions.length > 1
          ? `(${conditions.join(" and ")})`
          : `(${conditions.join("")})`;

      case Quantifier.Any:
        return conditions.length > 1
          ? `(${conditions.join(" or ")})`
          : `(${conditions.join("")})`;

      default:
        const number = parseInt(quantifier, 10);

        if (isNaN(number)) {
          throw new Error(`Quantifier is not a number ${quantifier}`);
        }

        //
        // Check if provided number is more than the actual number of conditions
        //

        if (number > conditions.length) {
          throw new Error(
            `Number of requested matches ${number} > actual number of conditions ${conditions.length}`
          );
        }

        const combinations = ArrayUtils.createNCombinations(conditions, number);

        const combinationGroups = combinations.map(
          (c: string[]) => `(${c.join(" and ")})`
        );

        return combinationGroups.length > 1
          ? `(${combinationGroups.join(" or ")})`
          : `${combinationGroups.join("")}`;
    }
  }
}
