import dayjs from 'dayjs';

export function replaceFunctionCall(sqlString: string, params?: Array<string>) {
  let sql = sqlString;

  params?.map((it, index) => {
    sql = sql.replace(`$${index + 1}`, `'${it}'`);
  });
  const regex = /@(\w+)\(([^()]+)\)/g;

  do {
    sql = sql.replace(regex, replacement);
  } while (sql.includes('@'));

  return sql;
}

function replacement(functionName: string, parameters: string) {
  const arrayParameters = parameters
    .split(',')
    .map((parameter) => parameter.trim())
    .map((item) => item.replace(/^'|'$/g, ''));
  switch (functionName) {
    case 'timestampToDate':
      return timestampToDate(...arrayParameters);
    case 'betweenDate':
      return betweenDate(...arrayParameters);
    case 'whereDate':
      return whereDate(...arrayParameters);
    default:
      throw Error('Invalid function name');
  }
}

function betweenDate(...columnName: Array<string>) {
  return `${columnName[0]} between ${addQuotationMarks(columnName[1])} and ${addQuotationMarks(columnName[2])}`;
}

function timestampToDate(...columnName: Array<string>) {
  return `${columnName[0]}::date`;
}

function whereDate(...columnName: Array<any>) {
  if (columnName[0] == 'MONTH')
    return betweenDate(
      ...[
        columnName[1],
        `${columnName[2]}`,
        `${dayjs(columnName[2]).add(1, 'month').subtract(1, 'd').endOf('month').format('YYYY-MM-DD')}`,
      ],
    );
  if (columnName[0] == 'YEAR')
    return betweenDate(
      ...[
        columnName[1],
        `${columnName[2]}`,
        `${dayjs(columnName[2]).add(1, 'year').subtract(1, 'd').endOf('month').format('YYYY-MM-DD')}`,
      ],
    );
  if (columnName[0] == 'QUARTER')
    return betweenDate(
      ...[
        columnName[1],
        `${columnName[2]}`,
        `${dayjs(columnName[2]).add(3, 'month').subtract(1, 'd').endOf('month').format('YYYY-MM-DD')}`,
      ],
    );
}

function addQuotationMarks(columnName: string) {
  return `${columnName.includes('::') ? `${columnName}` : `'${columnName}'`}`;
}
