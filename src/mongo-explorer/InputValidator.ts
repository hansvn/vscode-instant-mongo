export const ForbiddenChars: { [key: string]: string[] } = {
    DB: ['/', '\\', '.', ' ', '"', '$', '*', '<', '>', ':', '|', '?'],
    COL: ['$']
};

export class InputValidator {
    public static validateDatabase(input: string, existingDatabases: { name: string }[] = []): string | null {
        if (input === '') {
            return 'Database name can not be empty';
        }

        const forbiddenRegex = new RegExp(`[${ForbiddenChars.DB.join('\\')}]`, 'g');
        const invalidChars = input.match(forbiddenRegex);
        if (invalidChars?.length) {
            return `Database name contains invalid characters ('${invalidChars.join('\', \'')}')`;
        }

        const matchedDbs: { name: string }[] = existingDatabases.filter((col: { name: string }) => col.name === input);
        if (matchedDbs.length) {
            return `Database '${input}' already exists`;
        }

        return null;
    }

    public static validateCollection(input: string, existingCollections: { name: string }[] = []): string | null {
        if (input === '') {
            return 'Collection name can not be empty';
        } else if (input.substr(0, 7) === 'system.') {
            return 'Collection names can not start with `system.`';
        }

        const forbiddenRegex = new RegExp(`[${ForbiddenChars.COL.join('\\')}]`, 'g');
        const invalidChars = input.match(forbiddenRegex);
        if (invalidChars?.length) {
            return `Collection names can not include these characters: '${invalidChars.join('\', \'')}'`;
        }

        const matchedCols: { name: string }[] = existingCollections.filter((col: { name: string }) => col.name === input);
        if (matchedCols.length) {
            return `Collection '${input}' already exists`;
        }

        return null;
    }
}